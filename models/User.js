const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true }, // ✅ Ensure email is required
    password_hash: { type: DataTypes.STRING, allowNull: false },
}, {
    tableName: "user",
    timestamps: false,
});

module.exports = User;
