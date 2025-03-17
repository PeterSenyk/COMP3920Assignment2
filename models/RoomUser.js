const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomUser = sequelize.define('RoomUser', {
    room_user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Example extra column if you want to track "last read" messages, etc.
    last_read_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'room_user',
    timestamps: false,
});

module.exports = RoomUser;
