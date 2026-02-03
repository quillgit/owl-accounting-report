const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ParameterJurnal = sequelize.define('ParameterJurnal', {
    kodeaplikasi: {
        type: DataTypes.STRING(3),
        primaryKey: true
    },
    jurnalid: {
        type: DataTypes.STRING(3),
        primaryKey: true
    },
    noakundebet: DataTypes.STRING(15),
    noakunkredit: DataTypes.STRING(15)
}, {
    tableName: 'keu_5parameterjurnal',
    timestamps: false
});

module.exports = ParameterJurnal;
