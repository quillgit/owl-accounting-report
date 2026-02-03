const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Organisasi = sequelize.define('Organisasi', {
    kodeorganisasi: {
        type: DataTypes.STRING(20),
        primaryKey: true
    },
    namaorganisasi: DataTypes.STRING(255),
    tipe: DataTypes.STRING(50),
    induk: DataTypes.STRING(50),
    // regional: DataTypes.STRING(50) // Disabled: Column does not exist in 'organisasi' table
}, {
    tableName: 'organisasi'
});

module.exports = Organisasi;
