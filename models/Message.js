const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Room = require("./Room");
const RoomUser = require("./RoomUser");

const Message = sequelize.define("Message", {
    message_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Room, key: "room_id" } },
    text: { type: DataTypes.TEXT, allowNull: false },
    sent_datetime: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, {
    tableName: "message",
    timestamps: false,
});

// Ensure associations
Room.hasMany(Message, { foreignKey: "room_id" });
Message.belongsTo(Room, { foreignKey: "room_id" });

module.exports = Message;
