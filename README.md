# 🍽️ POS Sistema Multipunto - Restaurante

Sistema de Punto de Venta moderno para restaurantes con gestión de mesas, turnos, inventario y reportes.

---

## 🎯 **Características Principales**

### ✅ **Completamente Funcional**
- 🖥️ **POS Unificado** con mesas persistentes
- 🍔 **Gestión de Menú** e inventario
- 👥 **Gestión de Clientes**
- 💰 **Sistema de Ventas** con múltiples métodos de pago
- 🕐 **Sistema de Turnos/Cortes** (Backend completo)
- 📊 **Reportes y Dashboard**
- ❌ **Cancelación de tickets** con motivos
- 🔄 **Actualizaciones en tiempo real** (Socket.io)

### 🚧 **En Desarrollo**
- 🖨️ **Impresión de tickets** (POS-80)
- 📱 **App móvil** React Native
- 📈 **Gráficas avanzadas**

---

## 🛠️ **Tecnologías**

### **Backend**
- Node.js + Express
- SQLite + Sequelize ORM
- Socket.io
- JWT para autenticación

### **Frontend**
- React 18
- Tailwind CSS
- Lucide Icons
- Axios

### **Infraestructura**
- Google Cloud VM
- PM2
- Git/GitHub

---

## 🚀 **Instalación y Despliegue**

### **Requisitos**
- Node.js 16+
- npm o yarn
- Git

### **Clonar repositorio**
```bash
git clone https://github.com/Romanf1rr/pos-multipunto-restaurante.git
cd pos-multipunto-restaurante
```

### **Instalar dependencias**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### **Configurar variables de entorno**
```bash
# backend/.env
PORT=3000
JWT_SECRET=tu_secret_key_aqui
DATABASE_PATH=./database/pos.db
```

### **Iniciar desarrollo**
```bash
# Backend (puerto 3000)
cd backend
npm start

# Frontend (puerto 3001)
cd frontend
npm start
```

### **Build para producción**
```bash
cd frontend
npm run build

# El backend servirá los archivos estáticos desde /frontend/build
```

---

## 📡 **API Endpoints**

### **Autenticación**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### **Ventas**
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `PUT /api/sales/:id/cancel` - Cancelar ticket

### **Turnos**
- `POST /api/shifts` - Abrir turno
- `GET /api/shifts/active` - Turno activo
- `PUT /api/shifts/:id/close` - Cerrar turno
- `GET /api/shifts` - Listar turnos

### **Reportes**
- `GET /api/reports/dashboard` - Dashboard
- `GET /api/reports/cancelled` - Tickets cancelados
- `GET /api/reports/by-payment-method` - Por método de pago
- `GET /api/reports/by-user` - Por usuario

### **Productos**
- `GET /api/menu` - Listar productos
- `POST /api/menu` - Crear producto
- `PUT /api/menu/:id` - Actualizar producto
- `DELETE /api/menu/:id` - Eliminar producto

### **Clientes**
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Crear cliente
- `GET /api/customers/search?phone=XXX` - Buscar por teléfono

---

## 🗄️ **Estructura de Base de Datos**

### **Tablas Principales**
- `users` - Usuarios del sistema
- `menu_items` - Productos/menú
- `categories` - Categorías de productos
- `customers` - Clientes
- `tables` - Mesas del restaurante
- `sales` - Ventas completadas
- `sale_items` - Items de cada venta
- `shifts` - Turnos/cortes de caja
- `carts` - Carritos de compra (temporal)

---

## 📊 **Flujo de Trabajo**

1. **Iniciar sesión** como administrador/cajero
2. **Abrir turno** con efectivo inicial
3. **Seleccionar mesa** o tipo de orden
4. **Agregar productos** al carrito
5. **Completar venta** con método de pago
6. **Ver estadísticas** en tiempo real
7. **Cerrar turno** al finalizar jornada
8. **Imprimir corte** de turno

---

## 🎨 **Capturas de Pantalla**

*(Agregar screenshots aquí)*

---

## 📋 **Roadmap**

Ver [PROCESS.md](./PROCESS.md) para detalles completos.

### **Corto Plazo (1-2 semanas)**
- [ ] UI completa de turnos
- [ ] Impresión de tickets
- [ ] Sincronización con app móvil

### **Mediano Plazo (1 mes)**
- [ ] Gráficas y reportes avanzados
- [ ] Gestión multi-usuario
- [ ] Exportación de reportes

### **Largo Plazo (3+ meses)**
- [ ] Integración con pagos electrónicos
- [ ] Programa de lealtad
- [ ] Reservaciones
- [ ] Analytics avanzado

---

## 🤝 **Contribuir**

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 **Licencia**

Este proyecto es privado y propietario.

---

## 👨‍💻 **Autor**

**Román Reyes**
- GitHub: [@Romanf1rr](https://github.com/Romanf1rr)

---

## 🐛 **Reportar Bugs**

Si encuentras un bug, por favor crea un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots (si aplica)

---

## 📞 **Soporte**

Para soporte o preguntas, contactar vía GitHub Issues.

---

**Hecho con ❤️ para mejorar la gestión de restaurantes**
