const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Pivot table linking Message <-> Emoji, plus user_id
const MessageReaction = sequelize.define('MessageReaction', {
    message_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    emoji_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
}, {
    tableName: 'message_reaction',
    timestamps: false,
});

module.exports = MessageReaction;
