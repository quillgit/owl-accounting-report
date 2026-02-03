const sequelize = require('./config/sequelize');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const [jurnalCols] = await sequelize.query("SHOW COLUMNS FROM keu_jurnaldt");
        console.log('keu_jurnaldt columns:', jurnalCols.map(c => c.Field));

        const [saldoCols] = await sequelize.query("SHOW COLUMNS FROM keu_saldobulanan_vw");
        console.log('keu_saldobulanan_vw columns:', saldoCols.map(c => c.Field));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
