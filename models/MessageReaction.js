const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Message = require("./Message");
const Emoji = require("./Emoji");
const User = require("./User");

const MessageReaction = sequelize.define("MessageReaction", {
    message_id: { type: DataTypes.INTEGER, references: { model: Message, key: "message_id" }, primaryKey: true },
    emoji_id: { type: DataTypes.INTEGER, references: { model: Emoji, key: "emoji_id" }, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, references: { model: User, key: "user_id" }, primaryKey: true },
}, {
    tableName: "message_reaction",
    timestamps: false,
});

Message.belongsToMany(Emoji, { through: MessageReaction, foreignKey: "message_id" });
Emoji.belongsToMany(Message, { through: MessageReaction, foreignKey: "emoji_id" });

module.exports = MessageReaction;
