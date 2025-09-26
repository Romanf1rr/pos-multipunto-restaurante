// backend/routes/menu.js
const express = require('express');
const { models } = require('../database/init');
const { authenticateToken } = require('./auth');
const { MenuItem, Category } = models;

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
    const { active = true } = req.query;
    
    const where = {};
    if (active !== 'false') {
      where.isActive = true;
    }
    
    const categories = await Category.findAll({
      where,
      include: [
        {
          model: MenuItem,
          where: active !== 'false' ? { isActive: true } : {},
          required: false
        }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
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

// GET /api/menu/items/:id - Obtener item específico
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByPk(id, {
      include: [Category]
    });
    
    if (!menuItem) {
      return res.status(404).json({
        error: 'Item del menú no encontrado'
      });
    }
    
    res.json({
      success: true,
      menuItem
    });
    
  } catch (error) {
    console.error('Error obteniendo item:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/menu/items - Crear nuevo item
router.post('/items', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { name, description, price, cost, image, categoryId, stock, isActive } = req.body;
    
    // Validar datos
    if (!name || !price || !categoryId) {
      return res.status(400).json({
        error: 'Nombre, precio y categoría son requeridos'
      });
    }
    
    // Verificar que la categoría existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({
        error: 'Categoría no encontrada'
      });
    }
    
    const menuItem = await MenuItem.create({
      name,
      description,
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : 0,
      image,
      categoryId,
      stock: stock !== undefined ? parseInt(stock) : -1,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Obtener el item completo con la categoría
    const completeItem = await MenuItem.findByPk(menuItem.id, {
      include: [Category]
    });
    
    res.status(201).json({
      success: true,
      message: 'Item creado correctamente',
      menuItem: completeItem
    });
    
  } catch (error) {
    console.error('Error creando item:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/menu/items/:id - Actualizar item
router.put('/items/:id', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({
        error: 'Item del menú no encontrado'
      });
    }
    
    // Si se actualiza la categoría, verificar que existe
    if (updates.categoryId) {
      const category = await Category.findByPk(updates.categoryId);
      if (!category) {
        return res.status(400).json({
          error: 'Categoría no encontrada'
        });
      }
    }
    
    // Procesar campos numéricos
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price);
    }
    if (updates.cost !== undefined) {
      updates.cost = parseFloat(updates.cost);
    }
    if (updates.stock !== undefined) {
      updates.stock = parseInt(updates.stock);
    }
    
    await menuItem.update(updates);
    
    // Obtener el item actualizado con la categoría
    const updatedItem = await MenuItem.findByPk(id, {
      include: [Category]
    });
    
    res.json({
      success: true,
      message: 'Item actualizado correctamente',
      menuItem: updatedItem
    });
    
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/menu/items/:id - Eliminar item
router.delete('/items/:id', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { id } = req.params;
    
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({
        error: 'Item del menú no encontrado'
      });
    }
    
    // En lugar de eliminar, desactivar el item
    await menuItem.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Item desactivado correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/menu/categories - Crear nueva categoría
router.post('/categories', async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { name, description, sortOrder } = req.body;
    
    // Validar datos
    if (!name) {
      return res.status(400).json({
        error: 'El nombre es requerido'
      });
    }
    
    const category = await Category.create({
      name,
      description,
      sortOrder: sortOrder || 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada correctamente',
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
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }
    
    await category.update(updates);
    
    res.json({
      success: true,
      message: 'Categoría actualizada correctamente',
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