const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Emoji = sequelize.define('Emoji', {
    emoji_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'emoji',
    timestamps: false,
});

module.exports = Emoji;
