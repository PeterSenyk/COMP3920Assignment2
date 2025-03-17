// config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Initialize Sequelize w/ environment variables or your local config
const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
});

module.exports = sequelize;
