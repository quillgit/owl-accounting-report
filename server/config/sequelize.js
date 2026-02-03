const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'owl',
    process.env.DB_USER || 'agung',
    process.env.DB_PASSWORD || 'your_password',
    {
        host: process.env.DB_HOST || 'erp.mktr.co.id',
        dialect: 'mysql',
        logging: false,
        timezone: '+07:00',
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: false,
            freezeTableName: true
        }
    }
);

module.exports = sequelize;
