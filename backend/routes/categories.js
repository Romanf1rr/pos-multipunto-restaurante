const express = require('express');
const router = express.Router();
const { Category } = require('../database/init'); // Ajusta la ruta si tus modelos están en otro archivo

// Crear nueva categoría
router.post('/', async (req, res) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido.' });
    }
    const nuevaCategoria = await Category.create({
      name,
      description: description || '',
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Mensaje claro para el frontend si ya existe una categoría con ese nombre
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear la categoría.' });
  }
});

// Obtener todas las categorías activas
router.get('/', async (req, res) => {
  try {
    const categorias = await Category.findAll({ where: { isActive: true } });
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las categorías.' });
  }
});

module.exports = router;