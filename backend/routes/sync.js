// backend/routes/sync.js
const express = require('express');
const { Op } = require('sequelize');
const { models } = require('../database/init');
const { authenticateToken } = require('./auth');
const { Sale, SaleItem, MenuItem, User, Table } = models;

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// POST /api/sync/sales - Sincronizar ventas
router.post('/sales', async (req, res) => {
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
router.get('/pending', async (req, res) => {
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

// GET /api/sync/status - Estado de sincronización
router.get('/status', async (req, res) => {
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

module.exports = router;