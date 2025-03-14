const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const RoomUser = require("./RoomUser");

const Message = sequelize.define("Message", {
    message_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: RoomUser, key: "room_user_id" } },
    sent_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    text: { type: DataTypes.TEXT, allowNull: false },
}, {
    tableName: "message",
    timestamps: false,
});

RoomUser.hasMany(Message, { foreignKey: "room_user_id" });
Message.belongsTo(RoomUser, { foreignKey: "room_user_id" });

module.exports = Message;
