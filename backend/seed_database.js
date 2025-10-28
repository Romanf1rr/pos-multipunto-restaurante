const { sequelize, User, Category, MenuItem, Table, Customer } = require('./database/init');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // 1. USUARIOS
    console.log('👥 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.bulkCreate([
      {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
        isActive: true
      },
      {
        username: 'tablet1',
        password: await bcrypt.hash('tablet123', 10),
        name: 'Mesero 1',
        role: 'waiter',
        isActive: true
      },
      {
        username: 'tablet2',
        password: await bcrypt.hash('caja123', 10),
        name: 'Cajero 1',
        role: 'cashier',
        isActive: true
      }
    ]);
    console.log('✅ Usuarios creados');

    // 2. PRODUCTOS
    console.log('🍽️ Creando productos...');
    await MenuItem.bulkCreate([
      { name: 'Nachos con Queso', description: 'Nachos crujientes con queso cheddar', price: 45.00, cost: 15.00, categoryId: 1, stock: -1 },
      { name: 'Alitas Picantes', description: '6 alitas con salsa búfalo', price: 65.00, cost: 25.00, categoryId: 1, stock: -1 },
      { name: 'Hamburguesa Clásica', description: 'Carne, lechuga, tomate, queso', price: 85.00, cost: 30.00, categoryId: 2, stock: -1 },
      { name: 'Pizza Margherita', description: 'Tomate, mozzarella, albahaca', price: 120.00, cost: 40.00, categoryId: 2, stock: -1 },
      { name: 'Tacos de Pastor', description: '3 tacos con cebolla y cilantro', price: 55.00, cost: 20.00, categoryId: 2, stock: -1 },
      { name: 'Quesadilla', description: 'Tortilla con queso y guisado', price: 50.00, cost: 15.00, categoryId: 2, stock: -1 },
      { name: 'Coca Cola', description: 'Refresco 355ml', price: 20.00, cost: 8.00, categoryId: 3, stock: -1 },
      { name: 'Agua Natural', description: 'Agua purificada 500ml', price: 15.00, cost: 5.00, categoryId: 3, stock: -1 },
      { name: 'Café Americano', description: 'Café recién hecho', price: 25.00, cost: 8.00, categoryId: 3, stock: -1 },
      { name: 'Jugo de Naranja', description: 'Jugo natural', price: 30.00, cost: 12.00, categoryId: 3, stock: -1 }
    ]);
    console.log('✅ Productos creados');

    // 3. MESAS
    console.log('🪑 Creando mesas...');
    const tables = [];
    for (let i = 1; i <= 6; i++) {
      tables.push({
        number: i,
        capacity: i <= 2 ? 2 : i <= 4 ? 4 : 6,
        status: 'available',
        isActive: true
      });
    }
    await Table.bulkCreate(tables);
    console.log('✅ Mesas creadas');

    console.log('🎉 Seed completado exitosamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
