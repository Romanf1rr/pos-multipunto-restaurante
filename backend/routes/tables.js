// backend/routes/tables.js
const express = require('express');
const { Table, Sale } = require('../database/init');
const { authenticateToken } = require('./auth');
const { Op } = require('sequelize');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/tables - Obtener todas las mesas
router.get('/', async (req, res) => {
  try {
    const { active = true, includeOrders = false } = req.query;
    
    const where = {};
    if (active !== 'false') {
      where.isActive = true;
    }
    
    const include = [];
    if (includeOrders === 'true') {
      include.push({
        model: Sale,
        where: {
          status: 'pending'
        },
        required: false
      });
    }
    
    const tables = await Table.findAll({
      where,
      include,
      order: [['number', 'ASC']]
    });
    
    res.json({
      success: true,
      tables
    });
    
  } catch (error) {
    console.error('Error obteniendo mesas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/tables/:id - Obtener mesa específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findByPk(id, {
      include: [
        {
          model: Sale,
          where: {
            status: 'pending'
          },
          required: false
        }
      ]
    });
    
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    res.json({
      success: true,
      table
    });
    
  } catch (error) {
    console.error('Error obteniendo mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/tables/:id/status - Cambiar estado de mesa
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;
    
    // Validar estado
    const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Estado de mesa inválido'
      });
    }
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    const oldStatus = table.status;
    await table.update({ status });
    
    // Emitir evento via Socket.io
    if (req.io) {
      req.io.emit('table-status-changed', {
        tableId: table.id,
        tableNumber: table.number,
        oldStatus,
        newStatus: status,
        updatedBy: req.user.username,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Estado de mesa actualizado',
      table: {
        id: table.id,
        number: table.number,
        status: table.status,
        capacity: table.capacity
      }
    });
    
  } catch (error) {
    console.error('Error actualizando estado de mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/tables/:id/reserve - Reservar mesa
router.post('/:id/reserve', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, reservationTime, notes } = req.body;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    if (table.status !== 'available') {
      return res.status(400).json({
        error: 'La mesa no está disponible para reserva'
      });
    }
    
    await table.update({ 
      status: 'reserved',
      // Aquí podrías agregar campos adicionales para la reserva
    });
    
    // Emitir evento via Socket.io
    if (req.io) {
      req.io.emit('table-reserved', {
        tableId: table.id,
        tableNumber: table.number,
        customerName,
        reservedBy: req.user.username,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Mesa reservada correctamente',
      table
    });
    
  } catch (error) {
    console.error('Error reservando mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/tables/:id/occupy - Ocupar mesa
router.post('/:id/occupy', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerCount } = req.body;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    if (table.status !== 'available' && table.status !== 'reserved') {
      return res.status(400).json({
        error: 'La mesa no está disponible'
      });
    }
    
    if (customerCount && customerCount > table.capacity) {
      return res.status(400).json({
        error: 'El número de clientes excede la capacidad de la mesa'
      });
    }
    
    await table.update({ status: 'occupied' });
    
    // Emitir evento via Socket.io
    if (req.io) {
      req.io.emit('table-occupied', {
        tableId: table.id,
        tableNumber: table.number,
        customerCount,
        occupiedBy: req.user.username,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Mesa ocupada correctamente',
      table
    });
    
  } catch (error) {
    console.error('Error ocupando mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/tables/:id/free - Liberar mesa
router.post('/:id/free', async (req, res) => {
  try {
    const { id } = req.params;
    const { requiresCleaning = false } = req.body;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    const newStatus = requiresCleaning ? 'cleaning' : 'available';
    await table.update({ status: newStatus });
    
    // Emitir evento via Socket.io
    if (req.io) {
      req.io.emit('table-freed', {
        tableId: table.id,
        tableNumber: table.number,
        newStatus,
        freedBy: req.user.username,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: `Mesa ${requiresCleaning ? 'marcada para limpieza' : 'liberada'} correctamente`,
      table
    });
    
  } catch (error) {
    console.error('Error liberando mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/tables/stats/occupancy - Estadísticas de ocupación
router.get('/stats/occupancy', async (req, res) => {
  try {
    const tables = await Table.findAll({
      where: { isActive: true }
    });
    
    const stats = {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      cleaning: tables.filter(t => t.status === 'cleaning').length
    };
    
    stats.occupancyRate = stats.total > 0 ? 
      ((stats.occupied + stats.reserved) / stats.total * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      stats,
      tables: tables.map(t => ({
        id: t.id,
        number: t.number,
        status: t.status,
        capacity: t.capacity
      }))
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/tables - Crear nueva mesa (solo admin/manager)
router.post('/', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { number, capacity, location } = req.body;
    
    // Validar datos
    if (!number || !capacity) {
      return res.status(400).json({
        error: 'Número y capacidad son requeridos'
      });
    }
    
    // Verificar que el número no exista
    const existingTable = await Table.findOne({ where: { number } });
    if (existingTable) {
      return res.status(400).json({
        error: 'Ya existe una mesa con ese número'
      });
    }
    
    const table = await Table.create({
      number: parseInt(number),
      capacity: parseInt(capacity),
      location,
      status: 'available'
    });
    
    res.status(201).json({
      success: true,
      message: 'Mesa creada correctamente',
      table
    });
    
  } catch (error) {
    console.error('Error creando mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/tables/:id - Actualizar mesa (solo admin/manager)
router.put('/:id', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    // Si se actualiza el número, verificar que no exista
    if (updates.number && updates.number !== table.number) {
      const existingTable = await Table.findOne({ 
        where: { 
          number: updates.number,
          id: { [Op.ne]: id }
        }
      });
      if (existingTable) {
        return res.status(400).json({
          error: 'Ya existe una mesa con ese número'
        });
      }
    }
    
    await table.update(updates);
    
    res.json({
      success: true,
      message: 'Mesa actualizada correctamente',
      table
    });
    
  } catch (error) {
    console.error('Error actualizando mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/tables/:id - Eliminar mesa (solo admin)
router.delete('/:id', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { id } = req.params;
    
    const table = await Table.findByPk(id);
    if (!table) {
      return res.status(404).json({
        error: 'Mesa no encontrada'
      });
    }
    
    // Verificar que la mesa no esté ocupada
    if (table.status === 'occupied') {
      return res.status(400).json({
        error: 'No se puede eliminar una mesa ocupada'
      });
    }
    
    // En lugar de eliminar, desactivar
    await table.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Mesa desactivada correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando mesa:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;