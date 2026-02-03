const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const RegionalAssignment = sequelize.define('RegionalAssignment', {
    regional: {
        type: DataTypes.STRING(10),
        primaryKey: true
    },
    kodeunit: {
        type: DataTypes.STRING(10),
        primaryKey: true
    }
}, {
    tableName: 'bgt_regional_assignment',
    timestamps: false
});

module.exports = RegionalAssignment;
