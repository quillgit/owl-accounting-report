const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SaldoBulanan = sequelize.define('SaldoBulanan', {
    // Composite PK simulation for Sequelize
    id: {
        type: DataTypes.VIRTUAL,
        get() {
            return `${this.kodeorg}-${this.periode}-${this.noakun}`;
        }
    },
    kodeorg: {
        type: DataTypes.STRING(10),
        primaryKey: true
    },
    periode: {
        type: DataTypes.STRING(6),
        primaryKey: true
    },
    noakun: {
        type: DataTypes.STRING(16),
        primaryKey: true
    },
    awal: DataTypes.DOUBLE,
    debet: DataTypes.DOUBLE,
    kredit: DataTypes.DOUBLE
}, {
    tableName: 'keu_saldobulanan_vw',
    timestamps: false
});

module.exports = SaldoBulanan;
