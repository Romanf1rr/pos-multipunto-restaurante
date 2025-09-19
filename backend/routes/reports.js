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
        salesByUser: Object.values(salesByUser)
      }
    });
    
  } catch (error) {
    console.error('Error generando reporte diario:', error);
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

module.exports = router;