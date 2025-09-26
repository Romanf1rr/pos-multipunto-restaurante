// backend/routes/sales.js
const express = require('express');
const { Op } = require('sequelize');
const { models, sequelize } = require('../database/init');
const { authenticateToken } = require('./auth');
const { Sale, SaleItem, MenuItem, User, Table, Customer } = models;

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// POST /api/sales - Crear nueva venta
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      items, 
      tableId, 
      customerId, 
      orderType = 'dine-in', // 'dine-in', 'takeaway', 'delivery'
      paymentMethod, 
      notes, 
      deviceId,
      deliveryFee = 0
    } = req.body;
    
    // Validar datos de entrada
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Los items de la venta son requeridos'
      });
    }
    
    // Validaciones según tipo de pedido
    if (orderType === 'dine-in' && !tableId) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Mesa es requerida para pedidos en restaurante'
      });
    }
    
    if (orderType === 'delivery' && !customerId) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Cliente es requerido para pedidos a domicilio'
      });
    }
    
    // Validar que la mesa exista (si aplica)
    if (tableId) {
      const table = await Table.findByPk(tableId);
      if (!table) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Mesa no encontrada'
        });
      }
    }
    
    // Validar que el cliente exista (si aplica)
    let customer = null;
    let deliveryAddress = null;
    if (customerId) {
      customer = await Customer.findByPk(customerId);
      if (!customer) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Cliente no encontrado'
        });
      }
      deliveryAddress = `${customer.address1}${customer.address2 ? ', ' + customer.address2 : ''}, ${customer.city}`;
    }
    
    // Calcular totales
    let subtotal = 0;
    const saleItems = [];
    
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.id);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Item del menú no encontrado: ${item.id}`
        });
      }
      
      // Verificar stock si es necesario
      if (menuItem.stock !== -1 && menuItem.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para ${menuItem.name}`
        });
      }
      
      const totalPrice = parseFloat(menuItem.price) * item.quantity;
      subtotal += totalPrice;
      
      saleItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: totalPrice,
        notes: item.notes || null
      });
    }
    
    // Calcular impuestos (configurable)
    const taxRate = parseFloat(process.env.TAX_RATE || '0');
    const tax = subtotal * taxRate;
    const deliveryFeeAmount = parseFloat(deliveryFee || 0);
    const total = subtotal + tax + deliveryFeeAmount;
    
    // Crear la venta
    const sale = await Sale.create({
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      deliveryFee: deliveryFeeAmount.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: paymentMethod || 'cash',
      orderType,
      notes,
      tableId: tableId || null,
      customerId: customerId || null,
      userId: req.user.userId,
      deviceId: deviceId || null,
      deliveryAddress,
      synced: false
    }, { transaction });
    
    // Crear los items de la venta
    for (const item of saleItems) {
      await SaleItem.create({
        ...item,
        saleId: sale.id
      }, { transaction });
      
      // Actualizar stock si es necesario
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (menuItem.stock !== -1) {
        await menuItem.update({
          stock: menuItem.stock - item.quantity
        }, { transaction });
      }
    }
    
    // Actualizar estado de mesa si se especifica
    if (tableId && orderType === 'dine-in') {
      const table = await Table.findByPk(tableId);
      if (table) {
        await table.update({
          status: 'occupied'
        }, { transaction });
      }
    }
    
    // Actualizar estadísticas del cliente
    if (customer) {
      await customer.update({
        lastOrderDate: new Date(),
        totalOrders: customer.totalOrders + 1
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Obtener la venta completa con relaciones
    const completeSale = await Sale.findByPk(sale.id, {
      include: [
        {
          model: SaleItem,
          include: [MenuItem]
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        },
        {
          model: Table,
          attributes: ['id', 'number']
        },
        {
          model: Customer,
          attributes: ['id', 'name', 'phone', 'address1', 'address2', 'city']
        }
      ]
    });
    
    // Emitir evento de nueva venta via Socket.io
    if (req.io) {
      req.io.emit('new-sale', {
        sale: completeSale,
        timestamp: new Date().toISOString()
      });
      
      // Emitir cambio de estado de mesa
      if (tableId && orderType === 'dine-in') {
        req.io.emit('table-updated', {
          tableId,
          status: 'occupied',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Venta creada correctamente',
      sale: completeSale
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error creando venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/sales - Obtener ventas
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      userId, 
      tableId,
      customerId,
      orderType,
      status = 'completed'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir filtros
    const where = { status };
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (tableId) {
      where.tableId = tableId;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (orderType) {
      where.orderType = orderType;
    }
    
    // Si no es admin, solo mostrar sus propias ventas
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      where.userId = req.user.userId;
    }
    
    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        {
          model: SaleItem,
          include: [MenuItem]
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        },
        {
          model: Table,
          attributes: ['id', 'number']
        },
        {
          model: Customer,
          attributes: ['id', 'name', 'phone', 'address1', 'address2', 'city']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      sales: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});


module.exports = router;

// GET /api/sales/today - Obtener ventas de hoy
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.between]: [today, tomorrow]
        },
        status: 'completed'
      },
      include: [
        {
          model: SaleItem,
          include: [MenuItem]
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        },
        {
          model: Table,
          attributes: ['id', 'number']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calcular estadísticas del día
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    res.json({
      success: true,
      sales,
      statistics: {
        totalSales,
        totalRevenue: totalRevenue.toFixed(2),
        averageTicket: averageTicket.toFixed(2),
        date: today.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo ventas de hoy:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/sales/:id - Obtener venta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: SaleItem,
          include: [MenuItem]
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        },
        {
          model: Table,
          attributes: ['id', 'number']
        }
      ]
    });
    
    if (!sale) {
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && sale.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    res.json({
      success: true,
      sale
    });
    
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/sales/:id/cancel - Cancelar venta
router.put('/:id/cancel', async (req, res) => {
  const transaction = await sequelize.transaction(); // ✅ Usar sequelize directamente
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const sale = await Sale.findByPk(id, {
      include: [SaleItem]
    });
    
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && sale.userId !== req.user.userId) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    // Verificar que la venta se pueda cancelar
    if (sale.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({
        error: 'La venta ya está cancelada'
      });
    }
    
    // Restaurar stock
    for (const item of sale.SaleItems) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (menuItem && menuItem.stock !== -1) {
        await menuItem.update({
          stock: menuItem.stock + item.quantity
        }, { transaction });
      }
    }
    
    // Actualizar estado de la venta
    await sale.update({
      status: 'cancelled',
      notes: `${sale.notes || ''} [CANCELADA: ${reason || 'Sin razón'}]`.trim()
    }, { transaction });
    
    await transaction.commit();
    
    // Emitir evento via Socket.io
    if (req.io) {
      req.io.emit('sale-cancelled', {
        saleId: sale.id,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Venta cancelada correctamente'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error cancelando venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/sales/stats/summary - Resumen de estadísticas
router.get('/stats/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }
    
    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      include: [SaleItem]
    });
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const totalItems = sales.reduce((sum, sale) => {
      return sum + sale.SaleItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    res.json({
      success: true,
      summary: {
        period,
        totalSales,
        totalRevenue: totalRevenue.toFixed(2),
        averageTicket: totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00',
        totalItems,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;