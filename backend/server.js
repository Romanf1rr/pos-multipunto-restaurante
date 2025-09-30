// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const categoriesRoutes = require('./routes/categories');

// Importar rutas y middleware
const { router: authRoutes } = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const menuRoutes = require('./routes/menu');
const tablesRoutes = require('./routes/tables');
const customersRoutes = require('./routes/customers'); // ✅ AGREGAR ESTA LÍNEA
const reportsRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync');

// Importar modelos de base de datos
const { initDatabase, sequelize } = require('./database/init');

// Configuración
const PORT = process.env.PORT || 3001;
const SOCKET_PORT = process.env.SOCKET_PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.io para sincronización en tiempo real
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
  crossOriginEmbedderPolicy: false
}));

// Middleware de compresión
app.use(compression());

// Middleware de logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Configurar CORS
// Configurar CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (postman, mobile, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-sync-timestamp']
};

app.use(cors(corsOptions));

// Middleware para agregar Socket.io a las requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware de logging personalizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const deviceId = req.headers['x-device-id'] || 'unknown';
  
  console.log(`[${timestamp}] ${req.method} ${req.path} - Device: ${deviceId}`);
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/customers', customersRoutes); // ✅ AGREGAR ESTA LÍNEA
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/categories', categoriesRoutes);

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: NODE_ENV,
    database: 'Connected', // TODO: Verificar conexión real
    sockets: io.engine.clientsCount
  });
});

// Ruta de información del sistema
app.get('/api/info', (req, res) => {
  res.json({
    name: 'POS Multipunto Backend',
    version: '1.0.0',
    description: 'Backend para Sistema POS Multipunto Offline',
    author: 'Tu Nombre',
    features: [
      'Autenticación JWT',
      'Sincronización en tiempo real',
      'Base de datos SQLite',
      'API REST completa',
      'Soporte offline',
      'Multipunto',
      'Gestión de clientes' // ✅ AGREGAR ESTA LÍNEA
    ],
    endpoints: {
      auth: '/api/auth',
      sales: '/api/sales', 
      menu: '/api/menu',
      tables: '/api/tables',
      customers: '/api/customers', // ✅ AGREGAR ESTA LÍNEA
      reports: '/api/reports',
      sync: '/api/sync'
    }
  });
});


// Servir archivos estáticos del frontend en producción
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Configuración de Socket.io para sincronización
io.on('connection', (socket) => {
  console.log(`🔌 Dispositivo conectado: ${socket.id}`);
  
  // Unirse a sala por tipo de dispositivo
  socket.on('join-device-type', (deviceType) => {
    socket.join(deviceType);
    console.log(`📱 Dispositivo ${socket.id} se unió a sala: ${deviceType}`);
    
    // Notificar a otros dispositivos
    socket.to(deviceType).emit('device-connected', {
      deviceId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Sincronizar venta nueva
  socket.on('new-sale', (saleData) => {
    console.log('💰 Nueva venta recibida:', saleData.id);
    
    // Broadcast a todos los dispositivos excepto el emisor
    socket.broadcast.emit('sale-synced', saleData);
  });
  
  // Sincronizar cambio de mesa
  socket.on('table-status-change', (tableData) => {
    console.log('🪑 Estado de mesa actualizado:', tableData);
    
    // Broadcast a todos los dispositivos
    socket.broadcast.emit('table-updated', tableData);
  });
  
  // Ping/Pong para mantener conexión
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  // Desconexión
  socket.on('disconnect', () => {
    console.log(`🔌 Dispositivo desconectado: ${socket.id}`);
  });
});

// Función para inicializar el servidor
async function startServer() {
  try {
    // Inicializar base de datos
    console.log('🗄️  Inicializando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos inicializada correctamente');
    
    // Crear carpetas necesarias si no existen
    const dirs = ['./logs', './database/backups', './uploads'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Carpeta creada: ${dir}`);
      }
    });
    
    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      console.log('\n🚀 ========================================');
      console.log(`   Servidor POS Multipunto iniciado`);
      console.log('========================================');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: puerto ${PORT}`);
      console.log(`⚙️  Entorno: ${NODE_ENV}`);
      console.log(`📊 API Info: http://localhost:${PORT}/api/info`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log('========================================\n');
    });
    
    // Manejo de cierre grácil
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Función de cierre grácil
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
  
  try {
    // Cerrar conexiones de Socket.io
    io.close();
    
    // Cerrar conexión de base de datos
    await sequelize.close();
    
    // Cerrar servidor HTTP
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
    
    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.log('⚠️  Forzando cierre del servidor...');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error durante el cierre:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
if (require.main === module) {
  startServer();
}

module.exports = { app, io, server };