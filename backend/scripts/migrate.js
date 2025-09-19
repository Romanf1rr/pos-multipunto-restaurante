// backend/scripts/migrate.js
const { initDatabase } = require('../database/init');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migración de base de datos...');
    
    // Configurar variables de entorno si no están definidas
    if (!process.env.DB_PATH) {
      process.env.DB_PATH = path.join(__dirname, '../database/pos.sqlite');
    }
    
    // Inicializar base de datos
    await initDatabase();
    
    console.log('✅ Migración completada exitosamente');
    console.log('📍 Base de datos ubicada en:', process.env.DB_PATH);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

// backend/scripts/seed.js
const { models } = require('../database/init');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Insertando datos de ejemplo...');
    
    const { User, Category, MenuItem, Table } = models;
    
    // Verificar si ya existen datos
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('⚠️  La base de datos ya contiene datos. Omitiendo seed...');
      return;
    }
    
    // Crear usuarios
    console.log('👥 Creando usuarios...');
    const users = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        name: 'Administrador del Sistema',
        role: 'admin'
      },
      {
        username: 'manager',
        password: await bcrypt.hash('manager123', 10),
        name: 'Gerente',
        role: 'manager'
      },
      {
        username: 'tablet1',
        password: await bcrypt.hash('tablet123', 10),
        name: 'Tablet Meseros',
        role: 'waiter'
      },
      {
        username: 'tablet2',
        password: await bcrypt.hash('caja123', 10),
        name: 'Tablet Caja',
        role: 'cashier'
      },
      {
        username: 'mesero1',
        password: await bcrypt.hash('mesa123', 10),
        name: 'Juan Pérez',
        role: 'waiter'
      },
      {
        username: 'mesero2',
        password: await bcrypt.hash('mesa123', 10),
        name: 'Ana García',
        role: 'waiter'
      },
      {
        username: 'cajero1',
        password: await bcrypt.hash('caja123', 10),
        name: 'Carlos López',
        role: 'cashier'
      }
    ];
    
    await User.bulkCreate(users);
    console.log(`✅ ${users.length} usuarios creados`);
    
    // Crear categorías
    console.log('📂 Creando categorías...');
    const categories = [
      { name: 'Platillos Principales', description: 'Comida principal del restaurante', sortOrder: 1 },
      { name: 'Bebidas Frías', description: 'Refrescos, jugos y bebidas frías', sortOrder: 2 },
      { name: 'Bebidas Calientes', description: 'Café, té y bebidas calientes', sortOrder: 3 },
      { name: 'Ensaladas', description: 'Ensaladas frescas y saludables', sortOrder: 4 },
      { name: 'Postres', description: 'Postres y dulces', sortOrder: 5 },
      { name: 'Entradas', description: 'Aperitivos y entradas', sortOrder: 6 },
      { name: 'Antojitos', description: 'Comida mexicana típica', sortOrder: 7 }
    ];
    
    const createdCategories = await Category.bulkCreate(categories);
    console.log(`✅ ${categories.length} categorías creadas`);
    
    // Crear items del menú
    console.log('🍽️  Creando items del menú...');
    const menuItems = [
      // Platillos Principales
      { name: 'Hamburguesa Clásica', description: 'Hamburguesa con carne, lechuga, tomate y papas', price: 89.00, cost: 45.00, image: '🍔', categoryId: createdCategories[0].id, stock: -1 },
      { name: 'Pizza Margherita', description: 'Pizza con salsa de tomate, mozzarella y albahaca', price: 125.00, cost: 65.00, image: '🍕', categoryId: createdCategories[0].id, stock: -1 },
      { name: 'Pollo a la Plancha', description: 'Pechuga de pollo a la plancha con verduras', price: 95.00, cost: 50.00, image: '🍗', categoryId: createdCategories[0].id, stock: -1 },
      { name: 'Pasta Alfredo', description: 'Pasta con salsa cremosa alfredo', price: 78.00, cost: 35.00, image: '🍝', categoryId: createdCategories[0].id, stock: -1 },
      { name: 'Salmón Teriyaki', description: 'Filete de salmón con salsa teriyaki', price: 145.00, cost: 80.00, image: '🐟', categoryId: createdCategories[0].id, stock: -1 },
      
      // Bebidas Frías
      { name: 'Coca Cola', description: 'Refresco de cola 355ml', price: 18.00, cost: 12.00, image: '🥤', categoryId: createdCategories[1].id, stock: 50 },
      { name: 'Pepsi', description: 'Refresco de cola 355ml', price: 18.00, cost: 12.00, image: '🥤', categoryId: createdCategories[1].id, stock: 30 },
      { name: 'Jugo de Naranja', description: 'Jugo natural de naranja', price: 22.00, cost: 15.00, image: '🧃', categoryId: createdCategories[1].id, stock: -1 },
      { name: 'Agua Fresca de Horchata', description: 'Agua fresca tradicional mexicana', price: 15.00, cost: 8.00, image: '🥤', categoryId: createdCategories[1].id, stock: -1 },
      { name: 'Limonada', description: 'Limonada natural con hielo', price: 20.00, cost: 10.00, image: '🍋', categoryId: createdCategories[1].id, stock: -1 },
      
      // Bebidas Calientes
      { name: 'Café Americano', description: 'Café negro tradicional', price: 25.00, cost: 8.00, image: '☕', categoryId: createdCategories[2].id, stock: -1 },
      { name: 'Cappuccino', description: 'Café con espuma de leche', price: 35.00, cost: 12.00, image: '☕', categoryId: createdCategories[2].id, stock: -1 },
      { name: 'Chocolate Caliente', description: 'Chocolate caliente con marshmallows', price: 30.00, cost: 15.00, image: '🍫', categoryId: createdCategories[2].id, stock: -1 },
      { name: 'Té Verde', description: 'Té verde natural', price: 20.00, cost: 5.00, image: '🍵', categoryId: createdCategories[2].id, stock: -1 },
      
      // Ensaladas
      { name: 'Ensalada César', description: 'Lechuga romana, crutones, parmesano y aderezo césar', price: 65.00, cost: 35.00, image: '🥗', categoryId: createdCategories[3].id, stock: -1 },
      { name: 'Ensalada Griega', description: 'Tomate, pepino, aceitunas, queso feta', price: 70.00, cost: 40.00, image: '🥗', categoryId: createdCategories[3].id, stock: -1 },
      { name: 'Ensalada de Pollo', description: 'Ensalada mixta con pollo a la plancha', price: 85.00, cost: 45.00, image: '🥗', categoryId: createdCategories[3].id, stock: -1 },
      
      // Postres
      { name: 'Pastel de Chocolate', description: 'Pastel de chocolate con helado', price: 45.00, cost: 20.00, image: '🍰', categoryId: createdCategories[4].id, stock: 8 },
      { name: 'Flan Napolitano', description: 'Flan tradicional mexicano', price: 35.00, cost: 15.00, image: '🍮', categoryId: createdCategories[4].id, stock: 6 },
      { name: 'Helado de Vainilla', description: 'Helado artesanal de vainilla', price: 25.00, cost: 12.00, image: '🍨', categoryId: createdCategories[4].id, stock: -1 },
      
      // Entradas
      { name: 'Nachos con Queso', description: 'Nachos con queso derretido y jalapeños', price: 55.00, cost: 25.00, image: '🧀', categoryId: createdCategories[5].id, stock: -1 },
      { name: 'Alitas Buffalo', description: 'Alitas de pollo con salsa buffalo', price: 65.00, cost: 35.00, image: '🍗', categoryId: createdCategories[5].id, stock: -1 },
      { name: 'Dedos de Queso', description: 'Palitos de queso empanizados', price: 48.00, cost: 22.00, image: '🧀', categoryId: createdCategories[5].id, stock: -1 },
      
      // Antojitos
      { name: 'Tacos de Pastor', description: 'Tacos con carne al pastor, piña y cebolla', price: 45.00, cost: 25.00, image: '🌮', categoryId: createdCategories[6].id, stock: -1 },
      { name: 'Quesadilla de Queso', description: 'Quesadilla tradicional con queso oaxaca', price: 35.00, cost: 18.00, image: '🫓', categoryId: createdCategories[6].id, stock: -1 },
      { name: 'Torta Ahogada', description: 'Torta tradicional tapatía con salsa', price: 55.00, cost: 30.00, image: '🥪', categoryId: createdCategories[6].id, stock: -1 },
      { name: 'Enchiladas Rojas', description: 'Enchiladas con salsa roja y queso', price: 65.00, cost: 35.00, image: '🌯', categoryId: createdCategories[6].id, stock: -1 },
      { name: 'Pozole Rojo', description: 'Pozole tradicional mexicano', price: 75.00, cost: 40.00, image: '🍲', categoryId: createdCategories[6].id, stock: -1 }
    ];
    
    await MenuItem.bulkCreate(menuItems);
    console.log(`✅ ${menuItems.length} items del menú creados`);
    
    // Crear mesas
    console.log('🪑 Creando mesas...');
    const tables = [
      { number: 1, capacity: 2, status: 'available', location: 'Ventana' },
      { number: 2, capacity: 4, status: 'available', location: 'Centro' },
      { number: 3, capacity: 6, status: 'available', location: 'Terraza' },
      { number: 4, capacity: 4, status: 'available', location: 'Centro' },
      { number: 5, capacity: 8, status: 'available', location: 'Salón privado' },
      { number: 6, capacity: 2, status: 'available', location: 'Barra' },
      { number: 7, capacity: 4, status: 'available', location: 'Terraza' },
      { number: 8, capacity: 6, status: 'available', location: 'Centro' },
      { number: 9, capacity: 2, status: 'available', location: 'Ventana' },
      { number: 10, capacity: 4, status: 'available', location: 'Centro' },
      { number: 11, capacity: 4, status: 'available', location: 'Terraza' },
      { number: 12, capacity: 8, status: 'available', location: 'Salón privado' }
    ];
    
    await Table.bulkCreate(tables);
    console.log(`✅ ${tables.length} mesas creadas`);
    
    console.log('\n🎉 ¡Datos de ejemplo insertados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   👥 Usuarios: ${users.length}`);
    console.log(`   📂 Categorías: ${categories.length}`);
    console.log(`   🍽️  Items del menú: ${menuItems.length}`);
    console.log(`   🪑 Mesas: ${tables.length}`);
    
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Admin: admin / admin123');
    console.log('   Manager: manager / manager123');
    console.log('   Tablet Meseros: tablet1 / tablet123');
    console.log('   Tablet Caja: tablet2 / caja123');
    console.log('   Mesero: mesero1 / mesa123');
    console.log('   Cajero: cajero1 / caja123');
    
  } catch (error) {
    console.error('❌ Error insertando datos:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    try {
      const { initDatabase } = require('../database/init');
      await initDatabase();
      await seedDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };