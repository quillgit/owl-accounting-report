const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Karyawan = sequelize.define('Karyawan', {
    karyawanid: {
        type: DataTypes.STRING(20),
        primaryKey: true
    },
    nik: DataTypes.STRING(10),
    namakaryawan: DataTypes.STRING(255),
    lokasitugas: DataTypes.STRING(50),
    bagian: DataTypes.STRING(50)
}, {
    tableName: 'datakaryawan'
});

module.exports = Karyawan;
