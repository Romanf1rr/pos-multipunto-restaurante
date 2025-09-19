// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models } = require('../database/init');
const { User, Shift } = models;

const router = express.Router();

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;
    
    // Validar datos de entrada
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username y password son requeridos'
      });
    }
    
    // Buscar usuario
    const user = await User.findOne({
      where: { 
        username,
        isActive: true
      }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }
    
    // Actualizar último login y dispositivo
    await user.update({
      lastLogin: new Date(),
      deviceId: deviceId || null
    });
    
    // Verificar si hay un turno activo
    let activeShift = await Shift.findOne({
      where: {
        userId: user.id,
        status: 'active'
      }
    });
    
    // Si no hay turno activo, crear uno nuevo
    if (!activeShift) {
      activeShift = await Shift.create({
        userId: user.id,
        startTime: new Date(),
        deviceId: deviceId || null,
        status: 'active'
      });
    }
    
    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role,
        shiftId: activeShift.id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Respuesta exitosa
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      },
      shift: {
        id: activeShift.id,
        startTime: activeShift.startTime,
        status: activeShift.status
      }
    });
    
    // Emitir evento de conexión via Socket.io
    if (req.io) {
      req.io.emit('user-connected', {
        userId: user.id,
        username: user.username,
        role: user.role,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { closeShift } = req.body;
    
    // Si se solicita cerrar turno
    if (closeShift) {
      const shift = await Shift.findOne({
        where: {
          userId: req.user.userId,
          status: 'active'
        }
      });
      
      if (shift) {
        // Calcular totales del turno
        const { Sale } = models;
        const shiftSales = await Sale.findAll({
          where: {
            userId: req.user.userId,
            createdAt: {
              [require('sequelize').Op.gte]: shift.startTime
            }
          }
        });
        
        const totalSales = shiftSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
        const totalTransactions = shiftSales.length;
        
        await shift.update({
          endTime: new Date(),
          totalSales,
          totalTransactions,
          status: 'closed'
        });
      }
    }
    
    // Emitir evento de desconexión
    if (req.io) {
      req.io.emit('user-disconnected', {
        userId: req.user.userId,
        username: req.user.username,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
    
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/profile - Obtener perfil del usuario
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }
    
    // Obtener turno activo
    const activeShift = await Shift.findOne({
      where: {
        userId: user.id,
        status: 'active'
      }
    });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        deviceId: user.deviceId
      },
      shift: activeShift ? {
        id: activeShift.id,
        startTime: activeShift.startTime,
        totalSales: activeShift.totalSales,
        totalTransactions: activeShift.totalTransactions
      } : null
    });
    
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validar datos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva son requeridas'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Buscar usuario
    const user = await User.findByPk(req.user.userId);
    
    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta'
      });
    }
    
    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await user.update({
      password: hashedPassword
    });
    
    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/users - Listar usuarios (solo admin)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Verificar permisos de admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/users - Crear nuevo usuario (solo admin)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    // Verificar permisos de admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    const { username, password, name, role } = req.body;
    
    // Validar datos
    if (!username || !password || !name || !role) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos'
      });
    }
    
    // Verificar que el username no exista
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        error: 'El nombre de usuario ya existe'
      });
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const newUser = await User.create({
      username,
      password: hashedPassword,
      name,
      role
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role
    }
  });
});

module.exports = { router, authenticateToken };