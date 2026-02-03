const sequelize = require('../config/sequelize');
const Organisasi = require('./Organisasi');
const Regional = require('./Regional');
const RegionalAssignment = require('./RegionalAssignment');
const Account = require('./Account');
const Supplier = require('./Supplier');
const Karyawan = require('./Karyawan');
const User = require('./User');
const JournalDetail = require('./JournalDetail');
const SaldoBulanan = require('./SaldoBulanan');
const ParameterJurnal = require('./ParameterJurnal');
const AdjustSaldoAwal = require('./AdjustSaldoAwal');

const db = {
    sequelize,
    Organisasi,
    Regional,
    RegionalAssignment,
    Account,
    Supplier,
    Karyawan,
    User,
    JournalDetail,
    SaldoBulanan,
    ParameterJurnal,
    AdjustSaldoAwal
};

// Define Associations
Organisasi.hasOne(RegionalAssignment, { foreignKey: 'kodeunit', sourceKey: 'kodeorganisasi' });
RegionalAssignment.belongsTo(Organisasi, { foreignKey: 'kodeunit', targetKey: 'kodeorganisasi' });
JournalDetail.belongsTo(Karyawan, { foreignKey: 'nik', targetKey: 'karyawanid' });
User.belongsTo(Karyawan, { foreignKey: 'karyawanid', targetKey: 'karyawanid' });

module.exports = db;
