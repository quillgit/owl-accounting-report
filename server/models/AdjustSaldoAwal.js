const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const AdjustSaldoAwal = sequelize.define('AdjustSaldoAwal', {
    kodeorg: {
        type: DataTypes.STRING(4),
        primaryKey: true
    },
    periode: {
        type: DataTypes.STRING(7),
        primaryKey: true
    },
    noakun: {
        type: DataTypes.STRING(13),
        primaryKey: true
    },
    nilai: DataTypes.DECIMAL(14, 2)
}, {
    tableName: 'adjust_saldo_awal',
    timestamps: false
});

module.exports = AdjustSaldoAwal;
