const fs = require('fs');

let content = fs.readFileSync('init.js', 'utf8');

// 1. Agregar modelo Shift solo si NO existe
if (!content.includes("const Shift = sequelize.define('Shift'")) {
  const shiftModel = `
// Modelo de Turnos/Shifts
const Shift = sequelize.define('Shift', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  startTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  endTime: { type: DataTypes.DATE, allowNull: true },
  startingCash: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  endingCash: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  expectedCash: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  totalSales: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  cashSales: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  cardSales: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalTransactions: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'closed'), defaultValue: 'active' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  deviceId: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'shifts', timestamps: true });

`;
  content = content.replace(/const Sale = sequelize\.define\('Sale'/,
    shiftModel + "const Sale = sequelize.define('Sale'");
  console.log('✅ Modelo Shift agregado');
}

// 2. Agregar campos a Sale solo si NO existen
if (!content.includes('shiftId:')) {
  const newFields = `,
  shiftId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'shifts', key: 'id' } },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
  cancelReason: { type: DataTypes.TEXT, allowNull: true }`;
  
  content = content.replace(/(deviceId: \{[^}]+\})(,?\s*\n)/,
    `$1${newFields}$2`);
  console.log('✅ Campos agregados a Sale');
}

// 3. Agregar relaciones solo si NO existen
if (!content.includes("Shift.belongsTo(User")) {
  const relations = `
// Relaciones Shift
Shift.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Shift, { foreignKey: 'userId' });
Shift.hasMany(Sale, { foreignKey: 'shiftId' });
Sale.belongsTo(Shift, { foreignKey: 'shiftId' });
`;
  content = content.replace(/(Sale\.belongsTo\(User[^;]+;)/,
    `$1${relations}`);
  console.log('✅ Relaciones agregadas');
}

// 4. Agregar a exports solo si NO existe
if (!content.includes('Shift,')) {
  content = content.replace(/module\.exports = \{/,
    'module.exports = {\n  Shift,');
  console.log('✅ Shift agregado a exports');
}

fs.writeFileSync('init.js', content, 'utf8');
console.log('🎉 init.js actualizado correctamente');
