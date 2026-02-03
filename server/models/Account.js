const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Account = sequelize.define('Account', {
    noakun: {
        type: DataTypes.STRING(16),
        primaryKey: true
    },
    namaakun: DataTypes.STRING(80),
    level: DataTypes.INTEGER
}, {
    tableName: 'keu_5akun'
});

module.exports = Account;
