require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', routes);

const sequelize = require('./config/sequelize');

// Base route
app.get('/', (req, res) => {
    res.send('Ledger API Server is running.');
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
