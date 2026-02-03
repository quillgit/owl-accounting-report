const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'erp.mktr.co.id',
    user: process.env.DB_USER || 'agung',
    password: process.env.DB_PASSWORD || 'your_password', // Replace with actual password or use env
    database: process.env.DB_NAME || 'owl',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00' // Adjust to Jakarta/local time if needed
});

module.exports = pool;
