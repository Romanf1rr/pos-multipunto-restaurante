// backend/routes/customers.js
const express = require('express');
const { Op } = require('sequelize');
const { models } = require('../database/init');
const { authenticateToken } = require('./auth');
const { Customer } = models;

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/customers - Obtener clientes
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      isActive = true 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir filtros
    const where = { isActive };
    
    if (search) {
      where[Op.or] = [
        { phone: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { address1: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      customers: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/search/:query - Búsqueda rápida de clientes
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const customers = await Customer.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { phone: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } }
        ]
      },
      order: [['name', 'ASC']],
      limit: 10
    });
    
    res.json({
      success: true,
      customers
    });
    
  } catch (error) {
    console.error('Error buscando clientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/:id - Obtener cliente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado'
      });
    }
    
    res.json({
      success: true,
      customer
    });
    
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/customers - Crear nuevo cliente
router.post('/', async (req, res) => {
  try {
    const { 
      phone, 
      name, 
      address1, 
      address2, 
      city, 
      email, 
      notes 
    } = req.body;
    
    // Validar datos requeridos
    if (!phone || !name || !address1) {
      return res.status(400).json({
        error: 'Teléfono, nombre y dirección son requeridos'
      });
    }
    
    // Verificar si el teléfono ya existe
    const existingCustomer = await Customer.findOne({
      where: { phone }
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        error: 'Ya existe un cliente con este número de teléfono'
      });
    }
    
    // Crear cliente
    const customer = await Customer.create({
      phone: phone.trim(),
      name: name.trim(),
      address1: address1.trim(),
      address2: address2?.trim() || '',
      city: city?.trim() || 'Ciudad Guzmán',
      email: email?.trim() || null,
      notes: notes?.trim() || null
    });
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      customer
    });
    
  } catch (error) {
    console.error('Error creando cliente:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Ya existe un cliente con este número de teléfono'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/customers/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      phone, 
      name, 
      address1, 
      address2, 
      city, 
      email, 
      notes 
    } = req.body;
    
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado'
      });
    }
    
    // Validar datos requeridos
    if (!phone || !name || !address1) {
      return res.status(400).json({
        error: 'Teléfono, nombre y dirección son requeridos'
      });
    }
    
    // Verificar si el teléfono ya existe (excluyendo el cliente actual)
    const existingCustomer = await Customer.findOne({
      where: { 
        phone,
        id: { [Op.ne]: id }
      }
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        error: 'Ya existe otro cliente con este número de teléfono'
      });
    }
    
    // Actualizar cliente
    await customer.update({
      phone: phone.trim(),
      name: name.trim(),
      address1: address1.trim(),
      address2: address2?.trim() || '',
      city: city?.trim() || 'Ciudad Guzmán',
      email: email?.trim() || null,
      notes: notes?.trim() || null
    });
    
    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      customer
    });
    
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Ya existe otro cliente con este número de teléfono'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/customers/:id - Desactivar cliente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado'
      });
    }
    
    // Soft delete - marcar como inactivo
    await customer.update({
      isActive: false
    });
    
    res.json({
      success: true,
      message: 'Cliente desactivado correctamente'
    });
    
  } catch (error) {
    console.error('Error desactivando cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/customers/:id/activate - Reactivar cliente
router.put('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado'
      });
    }
    
    await customer.update({
      isActive: true
    });
    
    res.json({
      success: true,
      message: 'Cliente reactivado correctamente',
      customer
    });
    
  } catch (error) {
    console.error('Error reactivando cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/:id/orders - Obtener pedidos de un cliente
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado'
      });
    }
    
    const { Sale, SaleItem, MenuItem, User } = models;
    
    const orders = await Sale.findAll({
      where: { 
        customerId: id,
        orderType: 'delivery'
      },
      include: [
        {
          model: SaleItem,
          include: [MenuItem]
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      orders
    });
    
  } catch (error) {
    console.error('Error obteniendo pedidos del cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/customers/validate-phone - Validar si un teléfono ya existe
router.post('/validate-phone', async (req, res) => {
  try {
    const { phone, excludeId } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        error: 'Teléfono es requerido'
      });
    }
    
    const where = { phone };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    
    const existingCustomer = await Customer.findOne({ where });
    
    res.json({
      success: true,
      exists: !!existingCustomer,
      customer: existingCustomer || null
    });
    
  } catch (error) {
    console.error('Error validando teléfono:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/stats/summary - Estadísticas de clientes
router.get('/stats/summary', async (req, res) => {
  try {
    const totalCustomers = await Customer.count({ where: { isActive: true } });
    const totalInactive = await Customer.count({ where: { isActive: false } });
    
    // Clientes con pedidos recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCustomers = await Customer.count({
      where: {
        isActive: true,
        lastOrderDate: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    // Top 5 clientes por número de pedidos
    const { Sale } = models;
    const topCustomers = await Customer.findAll({
      where: { isActive: true },
      include: [{
        model: Sale,
        where: { orderType: 'delivery' },
        required: false
      }],
      order: [['totalOrders', 'DESC']],
      limit: 5
    });
    
    res.json({
      success: true,
      summary: {
        totalCustomers,
        totalInactive,
        recentCustomers,
        topCustomers: topCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          totalOrders: customer.totalOrders,
          lastOrderDate: customer.lastOrderDate
        }))
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;