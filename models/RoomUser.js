const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");
const Room = require("./Room");

const RoomUser = sequelize.define("RoomUser", {
    room_user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: "user_id" } },
    room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Room, key: "room_id" } },
}, {
    tableName: "room_user",
    timestamps: false,
});

User.belongsToMany(Room, { through: RoomUser, foreignKey: "user_id" });
Room.belongsToMany(User, { through: RoomUser, foreignKey: "room_id" });

module.exports = RoomUser;
