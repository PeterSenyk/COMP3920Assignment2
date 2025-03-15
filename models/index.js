const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

const User = require("./User");
const Room = require("./Room");
const RoomUser = require("./RoomUser");
const Message = require("./Message");  // ✅ Ensure Message is imported

module.exports = { sequelize, User, Room, RoomUser, Message };  // ✅ Ensure Message is exported
