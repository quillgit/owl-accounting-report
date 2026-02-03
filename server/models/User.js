const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
    namauser: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING(255)
    },
    karyawanid: {
        type: DataTypes.STRING(20)
    },
    hak: DataTypes.STRING(255),
    status: DataTypes.STRING(1)
}, {
    tableName: 'user',
    timestamps: false 
});

module.exports = User;
