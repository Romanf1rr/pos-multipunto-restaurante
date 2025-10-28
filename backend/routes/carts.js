// backend/routes/carts.js
const express = require('express');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Storage temporal de carritos en memoria (mejor usar Redis en producción)
const carts = new Map();

// Aplicar autenticación
router.use(authenticateToken);

// GET /api/carts/:tableId - Obtener carrito de una mesa
router.get('/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    const cart = carts.get(tableId) || { items: [], total: 0 };
    
    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/carts/:tableId/items - Agregar item al carrito
router.post('/:tableId/items', (req, res) => {
  try {
    const { tableId } = req.params;
    const { item, quantity } = req.body;
    
    let cart = carts.get(tableId) || { items: [], total: 0 };
    
    // Buscar si el item ya existe
    const existingItem = cart.items.find(i => i.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        ...item,
        quantity
      });
    }
    
    // Recalcular total
    cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    carts.set(tableId, cart);
    
    // 🔥 EMITIR EVENTO A TODOS LOS CLIENTES
    req.io.emit('cart-updated', {
      tableId,
      cart,
      action: 'add',
      item: { ...item, quantity },
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.json({
      success: true,
      cart
    });
    
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/carts/:tableId/items/:itemId - Remover item del carrito
router.delete('/:tableId/items/:itemId', (req, res) => {
  try {
    const { tableId, itemId } = req.params;
    
    let cart = carts.get(tableId) || { items: [], total: 0 };
    
    cart.items = cart.items.filter(i => i.id !== parseInt(itemId));
    cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    carts.set(tableId, cart);
    
    // 🔥 EMITIR EVENTO A TODOS LOS CLIENTES
    req.io.emit('cart-updated', {
      tableId,
      cart,
      action: 'remove',
      itemId,
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.json({
      success: true,
      cart
    });
    
  } catch (error) {
    console.error('Error removiendo del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/carts/:tableId - Limpiar carrito completo
router.delete('/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    
    carts.delete(tableId);
    
    // 🔥 EMITIR EVENTO A TODOS LOS CLIENTES
    req.io.emit('cart-cleared', {
      tableId,
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.json({
      success: true,
      message: 'Carrito limpiado'
    });
    
  } catch (error) {
    console.error('Error limpiando carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
