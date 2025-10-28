const express = require('express');
const { Op } = require('sequelize');
const { Sale, SaleItem, MenuItem, User, Shift, sequelize } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/reports/dashboard - Dashboard general
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Ventas completadas
    const completedSales = await Sale.findAll({
      where: {
        ...dateFilter,
        status: 'completed'
      }
    });
    
    // Ventas canceladas
    const cancelledSales = await Sale.findAll({
      where: {
        ...dateFilter,
        status: 'cancelled'
      }
    });
    
    // Calcular totales
    const totalRevenue = completedSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const cashSales = completedSales
      .filter(s => ["cash", "efectivo"].includes(s.paymentMethod))
      .reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const cardSales = totalRevenue - cashSales;
    
    // Productos más vendidos
    const topProducts = await SaleItem.findAll({
      attributes: [
        'menuItemId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
      ],
      include: [{
        model: MenuItem,
        attributes: ['name', 'price']
      }, {
        model: Sale,
        attributes: [],
        where: {
          ...dateFilter,
          status: 'completed'
        }
      }],
      group: ['menuItemId'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      dashboard: {
        totalRevenue: totalRevenue.toFixed(2),
        cashSales: cashSales.toFixed(2),
        cardSales: cardSales.toFixed(2),
        totalSales: completedSales.length,
        cancelledSales: cancelledSales.length,
        averageTicket: completedSales.length > 0 ? (totalRevenue / completedSales.length).toFixed(2) : '0.00',
        topProducts
      }
    });
    
  } catch (error) {
    console.error('Error generando dashboard:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/by-payment-method - Ventas por método de pago
router.get('/by-payment-method', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const salesByPayment = await Sale.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      where: {
        ...dateFilter,
        status: 'completed'
      },
      group: ['paymentMethod']
    });
    
    res.json({
      success: true,
      data: salesByPayment
    });
    
  } catch (error) {
    console.error('Error en reporte por método de pago:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/by-user - Ventas por usuario
router.get('/by-user', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const salesByUser = await Sale.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      include: [{
        model: User,
        attributes: ['name', 'username']
      }],
      where: {
        ...dateFilter,
        status: 'completed'
      },
      group: ['userId', 'User.id']
    });
    
    res.json({
      success: true,
      data: salesByUser
    });
    
  } catch (error) {
    console.error('Error en reporte por usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/cancelled - Tickets cancelados
router.get("/cancelled", async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const dateFilter = {};
    if (startDate && endDate) dateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    const { count, rows } = await Sale.findAndCountAll({
      where: { ...dateFilter, status: "cancelled" },
      include: [{ model: User, attributes: ["id", "name", "username"] }, { model: SaleItem, include: [MenuItem] }],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json({ success: true, cancelledSales: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
