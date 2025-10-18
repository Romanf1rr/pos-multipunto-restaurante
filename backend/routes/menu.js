// backend/routes/menu.js
const express = require('express');
const { MenuItem, Category } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/menu - Obtener menú completo
router.get('/', async (req, res) => {
  try {
    const { category, active = true } = req.query;
    
    const where = {};
    if (active !== 'false') {
      where.isActive = true;
    }
    if (category) {
      where.categoryId = category;
    }
    
    const menuItems = await MenuItem.findAll({
      where,
      include: [
        {
          model: Category,
          where: active !== 'false' ? { isActive: true } : {}
        }
      ],
      order: [
        [Category, 'sortOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    res.json({
      success: true,
      menuItems
    });
    
  } catch (error) {
    console.error('Error obteniendo menú:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/categories - Obtener categorías
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/menu/items - Crear nuevo producto
router.post('/items', async (req, res) => {
  try {
    const { name, description, price, cost, categoryId, image, stock } = req.body;
    
    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      cost: cost || 0,
      categoryId,
      image: image || null,
      stock: stock !== undefined ? stock : null,
      isActive: true
    });
    
    // 🔥 EMITIR EVENTO DE SOCKET.IO
    req.io.emit('menu-item-created', {
      menuItem: await MenuItem.findByPk(menuItem.id, {
        include: [Category]
      }),
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.status(201).json({
      success: true,
      menuItem
    });
    
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/menu/items/:id - Actualizar producto
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost, categoryId, image, stock, isActive } = req.body;
    
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    await menuItem.update({
      name: name !== undefined ? name : menuItem.name,
      description: description !== undefined ? description : menuItem.description,
      price: price !== undefined ? price : menuItem.price,
      cost: cost !== undefined ? cost : menuItem.cost,
      categoryId: categoryId !== undefined ? categoryId : menuItem.categoryId,
      image: image !== undefined ? image : menuItem.image,
      stock: stock !== undefined ? stock : menuItem.stock,
      isActive: isActive !== undefined ? isActive : menuItem.isActive
    });
    
    // 🔥 EMITIR EVENTO DE SOCKET.IO
    req.io.emit('menu-item-updated', {
      menuItem: await MenuItem.findByPk(id, {
        include: [Category]
      }),
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.json({
      success: true,
      menuItem
    });
    
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/menu/items/:id - Eliminar producto
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Soft delete
    await menuItem.update({ isActive: false });
    
    // 🔥 EMITIR EVENTO DE SOCKET.IO
    req.io.emit('menu-item-deleted', {
      itemId: id,
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/menu/categories - Crear categoría
router.post('/categories', async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    
    const category = await Category.create({
      name,
      description: description || null,
      sortOrder: sortOrder || 0,
      isActive: true
    });
    
    // 🔥 EMITIR EVENTO DE SOCKET.IO
    req.io.emit('category-created', {
      category,
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.status(201).json({
      success: true,
      category
    });
    
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/menu/categories/:id - Actualizar categoría
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    await category.update({
      name: name !== undefined ? name : category.name,
      description: description !== undefined ? description : category.description,
      sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
      isActive: isActive !== undefined ? isActive : category.isActive
    });
    
    // 🔥 EMITIR EVENTO DE SOCKET.IO
    req.io.emit('category-updated', {
      category,
      timestamp: new Date().toISOString(),
      user: req.user.username
    });
    
    res.json({
      success: true,
      category
    });
    
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
