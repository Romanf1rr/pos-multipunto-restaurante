const express = require('express');
const { Op } = require('sequelize');
const { Shift, Sale, User, sequelize } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// POST /api/shifts - Abrir nuevo turno
router.post('/', async (req, res) => {
  try {
    const { startingCash, notes, deviceId } = req.body;
    
    // Verificar que no haya un turno activo para este usuario
    const activeShift = await Shift.findOne({
      where: {
        userId: req.user.userId,
        status: 'active'
      }
    });
    
    if (activeShift) {
      return res.status(400).json({
        error: 'Ya tienes un turno activo. Cierra el turno actual antes de abrir uno nuevo.'
      });
    }
    
    // Crear nuevo turno
    const shift = await Shift.create({
      startTime: new Date(),
      userId: req.user.userId,
      startingCash: startingCash || 0,
      notes,
      deviceId,
      status: 'active'
    });
    
    const completeShift = await Shift.findByPk(shift.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'username']
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Turno abierto correctamente',
      shift: completeShift
    });
    
  } catch (error) {
    console.error('Error abriendo turno:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/shifts/active - Obtener turno activo del usuario
router.get('/active', async (req, res) => {
  try {
    const shift = await Shift.findOne({
      where: {
        userId: req.user.userId,
        status: 'active'
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'username']
      }]
    });
    
    if (!shift) {
      return res.json({
        success: true,
        shift: null
      });
    }
    
    // Calcular estadísticas del turno actual
    const sales = await Sale.findAll({
      where: {
        shiftId: shift.id,
        status: 'completed'
      }
    });
    
    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    
    sales.forEach(sale => {
      const amount = parseFloat(sale.total);
      totalSales += amount;
      
      if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'efectivo') {
        cashSales += amount;
      } else {
        cardSales += amount;
      }
    });
    
    res.json({
      success: true,
      shift: {
        ...shift.toJSON(),
        currentStats: {
          totalSales: totalSales.toFixed(2),
          cashSales: cashSales.toFixed(2),
          cardSales: cardSales.toFixed(2),
          totalTransactions: sales.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo turno activo:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/shifts/:id/close - Cerrar turno
router.put('/:id/close', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { endingCash, notes } = req.body;
    
    const shift = await Shift.findByPk(id);
    
    if (!shift) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Turno no encontrado'
      });
    }
    
    // Verificar permisos
    if (shift.userId !== req.user.userId && req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        error: 'No tienes permiso para cerrar este turno'
      });
    }
    
    if (shift.status === 'closed') {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Este turno ya está cerrado'
      });
    }
    
    // Calcular totales del turno
    const sales = await Sale.findAll({
      where: {
        shiftId: shift.id,
        status: 'completed'
      }
    });
    
    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    
    sales.forEach(sale => {
      const amount = parseFloat(sale.total);
      totalSales += amount;
      
      if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'efectivo') {
        cashSales += amount;
      } else {
        cardSales += amount;
      }
    });
    
    // Calcular efectivo esperado
    const expectedCash = parseFloat(shift.startingCash) + cashSales;
    
    // Actualizar turno
    await shift.update({
      endTime: new Date(),
      endingCash: endingCash || 0,
      expectedCash: expectedCash.toFixed(2),
      totalSales: totalSales.toFixed(2),
      cashSales: cashSales.toFixed(2),
      cardSales: cardSales.toFixed(2),
      totalTransactions: sales.length,
      status: 'closed',
      notes: notes ? `${shift.notes || ''}\n[CIERRE] ${notes}`.trim() : shift.notes
    }, { transaction });
    
    await transaction.commit();
    
    const completeShift = await Shift.findByPk(shift.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'username']
      }]
    });
    
    res.json({
      success: true,
      message: 'Turno cerrado correctamente',
      shift: completeShift
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error cerrando turno:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/shifts - Obtener todos los turnos
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      userId,
      startDate,
      endDate
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir filtros
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.startTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.startTime = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Si no es admin, solo ver sus propios turnos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      where.userId = req.user.userId;
    }
    
    const { count, rows } = await Shift.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'name', 'username']
      }],
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      shifts: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/shifts/:id - Obtener turno específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'username']
        },
        {
          model: Sale,
          include: [{
            model: User,
            attributes: ['id', 'name']
          }]
        }
      ]
    });
    
    if (!shift) {
      return res.status(404).json({
        error: 'Turno no encontrado'
      });
    }
    
    // Verificar permisos
    if (shift.userId !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    res.json({
      success: true,
      shift
    });
    
  } catch (error) {
    console.error('Error obteniendo turno:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
