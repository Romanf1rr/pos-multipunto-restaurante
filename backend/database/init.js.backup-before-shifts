const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configuración de la base de datos
const dbPath = process.env.DB_PATH || './database/pos.sqlite';
const dbDir = path.dirname(dbPath);

// Crear directorio de base de datos si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Configurar Sequelize con SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Modelo de Usuarios
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'cashier', 'waiter'),
    defaultValue: 'waiter'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  deviceId: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Modelo de Clientes
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [10, 20]
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  address1: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address2: {
    type: DataTypes.STRING(255)
  },
  city: {
    type: DataTypes.STRING(100),
    defaultValue: 'Ciudad Guzmán'
  },
  email: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastOrderDate: {
    type: DataTypes.DATE
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'customers',
  timestamps: true
});

// Modelo de Categorías de Menú
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'categories',
  timestamps: true
});

// Modelo de Items del Menú
const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  image: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: -1 // -1 = stock ilimitado
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: 'id'
    }
  }
}, {
  tableName: 'menu_items',
  timestamps: true
});

// Modelo de Mesas
const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'reserved', 'cleaning'),
    defaultValue: 'available'
  },
  location: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tables',
  timestamps: true
});

// Modelo de Ventas
const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'mixed'),
    defaultValue: 'cash'
  },
  orderType: {
    type: DataTypes.ENUM('dine-in', 'takeaway', 'delivery'),
    defaultValue: 'dine-in'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
    defaultValue: 'completed'
  },
  notes: {
    type: DataTypes.TEXT
  },
  tableId: {
    type: DataTypes.INTEGER,
    references: {
      model: Table,
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: Customer,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  deviceId: {
    type: DataTypes.STRING
  },
  synced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  syncedAt: {
    type: DataTypes.DATE
  },
  deliveryAddress: {
    type: DataTypes.TEXT
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  tableName: 'sales',
  timestamps: true
});

// Modelo de Items de Venta
const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT
  },
  saleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Sale,
      key: 'id'
    }
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    references: {
      model: MenuItem,
      key: 'id'
    }
  }
}, {
  tableName: 'sale_items',
  timestamps: true
});

// Modelo de Turnos
const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE
  },
  startingCash: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  endingCash: {
    type: DataTypes.DECIMAL(10, 2)
  },
  totalSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'closed'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  deviceId: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'shifts',
  timestamps: true
});

// Definir asociaciones
function setupAssociations() {
  // User associations
  User.hasMany(Sale, { foreignKey: 'userId' });
  User.hasMany(Shift, { foreignKey: 'userId' });
  
  // Customer associations
  Customer.hasMany(Sale, { foreignKey: 'customerId' });
  
  // Category associations
  Category.hasMany(MenuItem, { foreignKey: 'categoryId' });
  
  // MenuItem associations
  MenuItem.belongsTo(Category, { foreignKey: 'categoryId' });
  MenuItem.hasMany(SaleItem, { foreignKey: 'menuItemId' });
  
  // Table associations
  Table.hasMany(Sale, { foreignKey: 'tableId' });
  
  // Sale associations
  Sale.belongsTo(User, { foreignKey: 'userId' });
  Sale.belongsTo(Table, { foreignKey: 'tableId' });
  Sale.belongsTo(Customer, { foreignKey: 'customerId' });
  Sale.hasMany(SaleItem, { foreignKey: 'saleId', onDelete: 'CASCADE' });
  
  // SaleItem associations
  SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });
  SaleItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
  
  // Shift associations
  Shift.belongsTo(User, { foreignKey: 'userId' });
}

// Función para inicializar la base de datos
async function initDatabase() {
  try {
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a SQLite establecida correctamente');
    
    // Configurar asociaciones
    setupAssociations();
    
    // ARREGLO: Usar sync más seguro
    const syncOptions = {
      force: process.env.DB_FORCE_SYNC === 'true' // Solo resetea si está explícitamente configurado
      // Removemos alter: true que causaba el problema
    };
    
    // Si hay problemas con la base de datos existente, usar force
    if (process.env.NODE_ENV === 'development' && process.env.DB_RESET === 'true') {
      syncOptions.force = true;
      console.log('🔄 Modo desarrollo: Reseteando base de datos...');
    }
    
    await sequelize.sync(syncOptions);
    
    console.log('✅ Modelos sincronizados correctamente');
    
    // Insertar datos iniciales si es necesario
    await seedInitialData();
    
    return sequelize;
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Función para insertar datos iniciales
async function seedInitialData() {
  try {
    // Verificar si ya existen datos
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('🌱 Insertando datos iniciales...');
      
      // Crear usuarios iniciales
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      
      const users = [
        {
          username: 'admin',
          password: await bcrypt.hash('admin123', saltRounds),
          name: 'Administrador',
          role: 'admin'
        },
        {
          username: 'tablet1',
          password: await bcrypt.hash('tablet123', saltRounds),
          name: 'Tablet Meseros',
          role: 'waiter'
        },
        {
          username: 'tablet2',
          password: await bcrypt.hash('caja123', saltRounds),
          name: 'Tablet Caja',
          role: 'cashier'
        },
        {
          username: 'mesero1',
          password: await bcrypt.hash('mesa123', saltRounds),
          name: 'Juan Pérez',
          role: 'waiter'
        }
      ];
      
      await User.bulkCreate(users);
      
      // Crear clientes iniciales
      const customers = [
        {
          phone: '3331234567',
          name: 'Juan Pérez',
          address1: 'Av. Principal 123',
          address2: 'Col. Centro',
          city: 'Ciudad Guzmán',
          email: 'juan@email.com'
        },
        {
          phone: '3339876543',
          name: 'María García',
          address1: 'Calle Morelos 456',
          address2: 'Col. Jardines',
          city: 'Ciudad Guzmán',
          email: 'maria@email.com'
        },
        {
          phone: '3335555555',
          name: 'Carlos López',
          address1: 'Av. Revolución 789',
          address2: '',
          city: 'Ciudad Guzmán'
        }
      ];
      
      await Customer.bulkCreate(customers);
      
      // Crear categorías
      const categories = [
        { name: 'Platillos', description: 'Comida principal', sortOrder: 1 },
        { name: 'Bebidas', description: 'Bebidas frías y calientes', sortOrder: 2 },
        { name: 'Ensaladas', description: 'Ensaladas frescas', sortOrder: 3 },
        { name: 'Postres', description: 'Postres y dulces', sortOrder: 4 }
      ];
      
      const createdCategories = await Category.bulkCreate(categories);
      
      // Crear items del menú
      const menuItems = [
        { name: 'Hamburguesa Clásica', price: 89.00, cost: 45.00, image: '🍔', categoryId: createdCategories[0].id },
        { name: 'Pizza Margherita', price: 125.00, cost: 65.00, image: '🍕', categoryId: createdCategories[0].id },
        { name: 'Tacos de Pastor', price: 45.00, cost: 25.00, image: '🌮', categoryId: createdCategories[0].id },
        { name: 'Quesadilla', price: 35.00, cost: 18.00, image: '🫓', categoryId: createdCategories[0].id },
        { name: 'Café Americano', price: 25.00, cost: 8.00, image: '☕', categoryId: createdCategories[1].id },
        { name: 'Coca Cola', price: 18.00, cost: 12.00, image: '🥤', categoryId: createdCategories[1].id },
        { name: 'Jugo de Naranja', price: 22.00, cost: 15.00, image: '🧃', categoryId: createdCategories[1].id },
        { name: 'Ensalada César', price: 65.00, cost: 35.00, image: '🥗', categoryId: createdCategories[2].id }
      ];
      
      await MenuItem.bulkCreate(menuItems);
      
      // Crear mesas
      const tables = [
        { number: 1, capacity: 4, status: 'available' },
        { number: 2, capacity: 2, status: 'available' },
        { number: 3, capacity: 6, status: 'available' },
        { number: 4, capacity: 4, status: 'available' },
        { number: 5, capacity: 8, status: 'available' },
        { number: 6, capacity: 4, status: 'available' },
        { number: 7, capacity: 2, status: 'available' },
        { number: 8, capacity: 4, status: 'available' }
      ];
      
      await Table.bulkCreate(tables);
      
      console.log('✅ Datos iniciales insertados correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error al insertar datos iniciales:', error);
  }
}

// Exportar modelos y configuración
module.exports = {
  sequelize,
  initDatabase,
  User,
  Customer,
  Category,
  MenuItem,
  Table,
  Sale,
  SaleItem,
  Shift
};