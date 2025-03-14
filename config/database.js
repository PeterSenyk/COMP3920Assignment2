const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
});

const User = require("../models/User");
const Room = require("../models/Room");
const RoomUser = require("../models/RoomUser");
const Message = require("../models/Message");
const Emoji = require("../models/Emoji");
const MessageReaction = require("../models/MessageReaction");

// Sync all models
sequelize.sync()
    .then(() => console.log("Database & tables synced"))
    .catch(err => console.error("Error syncing database:", err));

module.exports = sequelize;
