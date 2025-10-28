const fs = require('fs');

// Leer init.js
let content = fs.readFileSync('init.js', 'utf8');

// 1. Agregar modelo Shift ANTES de "const Sale = sequelize.define('Sale'"
const shiftModel = `
// Modelo de Turnos/Shifts
const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startingCash: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  endingCash: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  expectedCash: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  totalSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  cashSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  cardSales: {
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
    type: DataTypes.TEXT,
    allowNull: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'shifts',
  timestamps: true
});

`;

// Insertar Shift antes de Sale
content = content.replace("const Sale = sequelize.define('Sale'", shiftModel + "const Sale = sequelize.define('Sale'");

// 2. Agregar campos a Sale (buscar deviceId dentro del modelo Sale y agregar después)
const newSaleFields = `,
  shiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'shifts',
      key: 'id'
    }
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }`;

// Buscar el deviceId dentro del modelo Sale y agregar los nuevos campos
const saleDeviceIdPattern = /(deviceId: \{[\s\S]*?\n  \})(,?\n)/;
content = content.replace(saleDeviceIdPattern, `$1${newSaleFields}$2`);

// 3. Agregar relaciones (después de las relaciones existentes de User y Sale)
const shiftRelations = `

// Relaciones Shift
Shift.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Shift, { foreignKey: 'userId' });
Shift.hasMany(Sale, { foreignKey: 'shiftId' });
Sale.belongsTo(Shift, { foreignKey: 'shiftId' });
`;

content = content.replace("Sale.belongsTo(User, { foreignKey: 'userId' });", 
  "Sale.belongsTo(User, { foreignKey: 'userId' });" + shiftRelations);

// 4. Agregar Shift al module.exports
content = content.replace("module.exports = {", "module.exports = {\n  Shift,");

// Guardar
fs.writeFileSync('init.js', content, 'utf8');

console.log('✅ init.js actualizado correctamente');
