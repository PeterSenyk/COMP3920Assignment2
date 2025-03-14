const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load env

// Initialize Sequelize
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
