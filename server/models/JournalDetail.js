const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Account = require('./Account');
const Supplier = require('./Supplier');
const Karyawan = require('./Karyawan');

const JournalDetail = sequelize.define('JournalDetail', {
    nojurnal: {
        type: DataTypes.STRING(25),
        primaryKey: true
    },
    noakun: {
        type: DataTypes.STRING(14),
        primaryKey: true
    },
    tanggal: DataTypes.DATEONLY,
    nourut: DataTypes.INTEGER,
    keterangan: DataTypes.STRING(500),
    jumlah: DataTypes.DECIMAL(18, 2),
    matauang: DataTypes.STRING(3),
    kurs: DataTypes.DECIMAL(18, 6),
    kodeorg: DataTypes.STRING(10),
    kodecustomer: DataTypes.STRING(10),
    kodesupplier: DataTypes.STRING(10),
    noreferensi: DataTypes.STRING(50),
    noaruskas: DataTypes.STRING(11),
    nodok: DataTypes.STRING(50),
    nik: DataTypes.STRING(10),
    kodeblok: DataTypes.STRING(45),
    revisi: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'keu_jurnaldt'
});

// Associations
JournalDetail.belongsTo(Account, { foreignKey: 'noakun', targetKey: 'noakun' });
JournalDetail.belongsTo(Supplier, { foreignKey: 'kodesupplier', targetKey: 'supplierid' });
JournalDetail.belongsTo(Karyawan, { foreignKey: 'nik', targetKey: 'nik' });

module.exports = JournalDetail;
