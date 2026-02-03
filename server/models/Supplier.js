const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Supplier = sequelize.define('Supplier', {
    supplierid: {
        type: DataTypes.STRING(20),
        primaryKey: true
    },
    namasupplier: DataTypes.STRING(255)
}, {
    tableName: 'log_5supplier'
});

module.exports = Supplier;
