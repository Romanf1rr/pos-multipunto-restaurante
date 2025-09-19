// backend/routes/reports.js
const express = require('express');
const { Op } = require('sequelize');
const { models } = require('../database/init');
const { authenticateToken } = require('./auth');
const { Sale, SaleItem, MenuItem, User, Shift, Category } = models;

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/reports/daily - Reporte diario
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Configurar rango de fechas
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Obtener ventas del día
    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
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
        }
      ]
    });
    
    // Calcular estadísticas
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + parseFloat(sale.tax), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Ventas por usuario
    const salesByUser = {};
    sales.forEach(sale => {
      const userId = sale.User.id;
      if (!salesByUser[userId]) {
        salesByUser[userId] = {
          user: sale.User,
          totalSales: 0,
          totalRevenue: 0
        };
      }
      salesByUser[userId].totalSales++;
      salesByUser[userId].totalRevenue += parseFloat(sale.total);
    });
    
    // Items más vendidos
    const itemStats = {};
    sales.forEach(sale => {
      sale.SaleItems.forEach(item => {
        const itemId = item.MenuItem.id;
        if (!itemStats[itemId]) {
          itemStats[itemId] = {
            item: item.MenuItem,
            quantity: 0,
            revenue: 0
          };
        }
        itemStats[itemId].quantity += item.quantity;
        itemStats[itemId].revenue += parseFloat(item.totalPrice);
      });
    });
    
    const topItems = Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    // Ventas por hora
    const salesByHour = {};
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = { hour: i, sales: 0, revenue: 0 };
    }
    
    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      salesByHour[hour].sales++;
      salesByHour[hour].revenue += parseFloat(sale.total);
    });
    
    res.json({
      success: true,
      report: {
        date: targetDate.toISOString().split('T')[0],
        summary: {
          totalSales,
          totalRevenue: totalRevenue.toFixed(2),
          totalTax: totalTax.toFixed(2),
          averageTicket: averageTicket.toFixed(2)
        },
        salesByUser: Object.values(salesByUser),
        topItems,
        salesByHour: Object.values(salesByHour)
      }
    });
    
  } catch (error) {
    console.error('Error generando reporte diario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/period - Reporte por período
router.get('/period', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Fechas de inicio y fin son requeridas'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        },
        status: 'completed'
      },
      include: [
        {
          model: SaleItem,
          include: [MenuItem]
        }
      ]
    });
    
    // Agrupar ventas
    const groupedSales = {};
    sales.forEach(sale => {
      let key;
      const date = sale.createdAt;
      
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().substr(0, 13) + ':00:00Z';
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const week = getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'month':
          key = date.toISOString().substr(0, 7);
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groupedSales[key]) {
        groupedSales[key] = {
          period: key,
          sales: 0,
          revenue: 0,
          items: 0
        };
      }
      
      groupedSales[key].sales++;
      groupedSales[key].revenue += parseFloat(sale.total);
      groupedSales[key].items += sale.SaleItems.reduce((sum, item) => sum + item.quantity, 0);
    });
    
    res.json({
      success: true,
      report: {
        period: { startDate, endDate, groupBy },
        data: Object.values(groupedSales).sort((a, b) => a.period.localeCompare(b.period))
      }
    });
    
  } catch (error) {
    console.error('Error generando reporte por período:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/shifts - Reporte de turnos
router.get('/shifts', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    const shifts = await Shift.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'username']
        }
      ],
      order: [['startTime', 'DESC']]
    });
    
    res.json({
      success: true,
      shifts
    });
    
  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Función auxiliar para obtener número de semana
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = router;

// backend/routes/sync.js
const express = require('express');
const { models } = require('../database/init');
const { authenticateToken } = require('./auth');
const { Sale, SaleItem, MenuItem, User, Table } = models;

const syncRouter = express.Router();

// Aplicar autenticación a todas las rutas
syncRouter.use(authenticateToken);

// POST /api/sync/sales - Sincronizar ventas
syncRouter.post('/sales', async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { sales } = req.body;
    
    if (!Array.isArray(sales)) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Se requiere un array de ventas'
      });
    }
    
    const syncedSales = [];
    const errors = [];
    
    for (const saleData of sales) {
      try {
        // Verificar si la venta ya existe
        const existingSale = await Sale.findOne({
          where: {
            id: saleData.id
          }
        });
        
        if (existingSale) {
          // Marcar como sincronizada
          await existingSale.update({
            synced: true,
            syncedAt: new Date()
          }, { transaction });
          
          syncedSales.push(existingSale);
          continue;
        }
        
        // Crear nueva venta
        const sale = await Sale.create({
          ...saleData,
          synced: true,
          syncedAt: new Date()
        }, { transaction });
        
        // Crear items de la venta
        if (saleData.items) {
          for (const itemData of saleData.items) {
            await SaleItem.create({
              ...itemData,
              saleId: sale.id
            }, { transaction });
          }
        }
        
        syncedSales.push(sale);
        
      } catch (error) {
        errors.push({
          saleId: saleData.id,
          error: error.message
        });
      }
    }
    
    await transaction.commit();
    
    // Emitir evento de sincronización
    if (req.io) {
      req.io.emit('sales-synced', {
        synced: syncedSales.length,
        errors: errors.length,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: `${syncedSales.length} ventas sincronizadas`,
      synced: syncedSales.length,
      errors
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error sincronizando ventas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/sync/pending - Obtener datos pendientes de sincronización
syncRouter.get('/pending', async (req, res) => {
  try {
    const { lastSync } = req.query;
    
    const where = { synced: false };
    if (lastSync) {
      where.createdAt = {
        [Op.gt]: new Date(lastSync)
      };
    }
    
    const pendingSales = await Sale.findAll({
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
        }
      ]
    });
    
    res.json({
      success: true,
      pendingSales,
      count: pendingSales.length
    });
    
  } catch (error) {
    console.error('Error obteniendo datos pendientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/sync/mark-synced - Marcar elementos como sincronizados
syncRouter.post('/mark-synced', async (req, res) => {
  try {
    const { saleIds } = req.body;
    
    if (!Array.isArray(saleIds)) {
      return res.status(400).json({
        error: 'Se requiere un array de IDs de ventas'
      });
    }
    
    await Sale.update(
      {
        synced: true,
        syncedAt: new Date()
      },
      {
        where: {
          id: saleIds
        }
      }
    );
    
    res.json({
      success: true,
      message: `${saleIds.length} ventas marcadas como sincronizadas`
    });
    
  } catch (error) {
    console.error('Error marcando como sincronizadas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/sync/status - Estado de sincronización
syncRouter.get('/status', async (req, res) => {
  try {
    const totalSales = await Sale.count();
    const syncedSales = await Sale.count({ where: { synced: true } });
    const pendingSales = totalSales - syncedSales;
    
    const lastSync = await Sale.findOne({
      where: { synced: true },
      order: [['syncedAt', 'DESC']],
      attributes: ['syncedAt']
    });
    
    res.json({
      success: true,
      status: {
        totalSales,
        syncedSales,
        pendingSales,
        syncPercentage: totalSales > 0 ? ((syncedSales / totalSales) * 100).toFixed(1) : 100,
        lastSync: lastSync?.syncedAt || null
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estado de sincronización:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/sync/force - Forzar sincronización completa
syncRouter.post('/force', async (req, res) => {
  try {
    // Verificar permisos de admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const pendingSales = await Sale.findAll({
      where: { synced: false },
      include: [SaleItem]
    });
    
    // Simular sincronización (aquí iría la lógica real de sync con servidor remoto)
    await Sale.update(
      {
        synced: true,
        syncedAt: new Date()
      },
      {
        where: { synced: false }
      }
    );
    
    // Emitir evento
    if (req.io) {
      req.io.emit('force-sync-completed', {
        synced: pendingSales.length,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: `Sincronización forzada completada: ${pendingSales.length} ventas`,
      synced: pendingSales.length
    });
    
  } catch (error) {
    console.error('Error en sincronización forzada:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = { reportRouter: router, syncRouter };