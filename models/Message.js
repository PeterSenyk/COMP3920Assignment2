const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const RoomUser = require("./RoomUser");

const Message = sequelize.define("Message", {
    message_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: RoomUser, key: "room_user_id" } },
    text: { type: DataTypes.TEXT, allowNull: false },
    sent_datetime: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, {
    tableName: "message",
    timestamps: false,
});

// ✅ Correct association
Message.belongsTo(RoomUser, { foreignKey: "room_user_id" });
RoomUser.hasMany(Message, { foreignKey: "room_user_id" });

module.exports = Message;
