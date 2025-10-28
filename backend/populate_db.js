const { sequelize, User, Category, MenuItem, Table } = require('./database/init');

async function populate() {
  try {
    // Verificar si ya hay datos
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('✅ Ya hay datos en la DB');
      return;
    }

    console.log('📊 Poblando base de datos...');

    // Crear usuarios (ya deberían existir del login)
    
    // Crear categorías
    const categories = await Category.bulkCreate([
      { name: 'Entradas', description: 'Aperitivos y entradas', sortOrder: 1 },
      { name: 'Platos Fuertes', description: 'Platos principales', sortOrder: 2 },
      { name: 'Bebidas', description: 'Bebidas frías y calientes', sortOrder: 3 },
      { name: 'Postres', description: 'Postres y dulces', sortOrder: 4 },
      { name: 'Extras', description: 'Complementos', sortOrder: 5 }
    ]);

    console.log('✅ Categorías creadas');

    // Crear mesas
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({
        numero: i,
        capacidad: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        estado: 'disponible'
      });
    }
    await Table.bulkCreate(tables);

    console.log('✅ Mesas creadas');
    console.log('🎉 Base de datos poblada correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

populate();
