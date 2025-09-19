# 🏪 Sistema POS Multipunto - Restaurantes y Negocios

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Versión](https://img.shields.io/badge/Versión-1.0.0--alpha-blue)
![Licencia](https://img.shields.io/badge/Licencia-MIT-green)

## 📋 Descripción del Proyecto

Sistema de Punto de Venta moderno, multipunto y offline-first diseñado para restaurantes, loncherías, cafeterías y papelerías. Funciona tanto online como offline, con sincronización automática entre dispositivos.

## 🎯 Características Principales

- ✅ **Funcionamiento Offline**: Opera sin conexión a internet
- ✅ **Multipunto**: Múltiples tablets/dispositivos conectados
- ✅ **PWA**: Instalable como aplicación nativa
- ✅ **Tiempo Real**: Sincronización automática entre dispositivos
- ✅ **Responsive**: Optimizado para tablets y desktop
- ✅ **Seguro**: Sistema de usuarios y roles

## 🏗️ Arquitectura del Sistema

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TABLET 1      │    │   SERVIDOR      │    │   TABLET 2      │
│   (Meseros)     │◄──►│   LOCAL         │◄──►│   (Caja)        │
│   React PWA     │    │   Node.js +     │    │   React PWA     │
│                 │    │   SQLite        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│
┌─────────────────┐
│   INTERNET      │
│   (Opcional)    │
│   Sincronización│
└─────────────────┘

## 📁 Estructura del Proyecto

pos-multipunto-restaurante/
├── 📁 frontend/                 # Aplicación React PWA
│   ├── 📁 public/
│   │   ├── manifest.json
│   │   └── sw.js               # Service Worker para offline
│   ├── 📁 src/
│   │   ├── 📁 components/      # Componentes reutilizables
│   │   ├── 📁 pages/          # Páginas principales
│   │   ├── 📁 hooks/          # Custom hooks
│   │   ├── 📁 services/       # Servicios de API y storage
│   │   └── 📁 utils/          # Utilidades
│   └── package.json
├── 📁 backend/                  # Servidor Node.js
│   ├── 📁 routes/             # Rutas de API
│   ├── 📁 models/             # Modelos de datos
│   ├── 📁 middleware/         # Middleware personalizado
│   ├── 📁 database/           # Configuración de BD
│   └── server.js
├── 📁 docs/                    # Documentación
│   ├── 📁 sesiones/           # Progreso por sesión
│   ├── api.md                 # Documentación API
│   ├── instalacion.md         # Guía de instalación
│   └── arquitectura.md        # Documentación técnica
├── 📁 scripts/                # Scripts de utilidad
│   ├── setup.sh              # Script de instalación
│   └── deploy.sh             # Script de despliegue
├── .env.example               # Variables de entorno
├── docker-compose.yml         # Para deployment
└── README.md                  # Este archivo


## 🛠️ Stack Tecnológico

### Frontend
- **React 18**: Framework principal
- **Tailwind CSS**: Estilos y diseño responsive
- **Lucide React**: Iconografía moderna
- **PWA**: Progressive Web App
- **IndexedDB**: Base de datos local

### Backend
- **Node.js**: Servidor
- **Express**: Framework web
- **SQLite**: Base de datos local
- **Socket.io**: Comunicación en tiempo real
- **JWT**: Autenticación

### DevOps
- **Docker**: Containerización
- **PM2**: Process manager
- **GitHub Actions**: CI/CD

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js 18+ 
- Git
- NPM o Yarn

### Comandos de Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/pos-multipunto-restaurante.git
cd pos-multipunto-restaurante

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Instalar dependencias del frontend
cd ../frontend
npm install

# 4. Configurar variables de entorno
cp .env.example .env

# 5. Inicializar base de datos
npm run db:migrate

# 6. Iniciar el proyecto
npm run dev