const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Regional = sequelize.define('Regional', {
    regional: {
        type: DataTypes.STRING(10),
        primaryKey: true
    },
    nama: DataTypes.STRING(40)
}, {
    tableName: 'bgt_regional'
});

module.exports = Regional;
