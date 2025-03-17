const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    message_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    room_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sent_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'message',
    timestamps: false,
});

module.exports = Message;
