const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");
const Room = require("./Room");

const RoomUser = sequelize.define("RoomUser", {
    room_user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: "user_id" }
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Room, key: "room_id" }
    },
    last_read_message_id: { // ✅ Add this to track unread messages
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: "room_user",
    timestamps: false
});

/* ✅ Associations */

// Room -> RoomUser (One Room can have many RoomUsers)
Room.hasMany(RoomUser, { foreignKey: "room_id", onDelete: "CASCADE" });
RoomUser.belongsTo(Room, { foreignKey: "room_id" });

// User -> RoomUser (One User can have many RoomUsers)
User.hasMany(RoomUser, { foreignKey: "user_id", onDelete: "CASCADE" });
RoomUser.belongsTo(User, { foreignKey: "user_id" });

// Many-to-Many Relationship (Users <-> Rooms)
User.belongsToMany(Room, { through: RoomUser, foreignKey: "user_id", otherKey: "room_id" });
Room.belongsToMany(User, { through: RoomUser, foreignKey: "room_id", otherKey: "user_id" });

module.exports = RoomUser;
