require("dotenv").config();
const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Session
app.use(
    session({
        secret: "mysecretkey",
        resave: false,
        saveUninitialized: true,
    })
);

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false, // Set to true if you want to see SQL queries in console
});

// Define User Model
const User = sequelize.define("User", {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Sync Database
sequelize
    .sync()
    .then(() => console.log("Database & tables created!"))
    .catch((err) => console.error("Error syncing database:", err));

// Home Page
app.get("/", (req, res) => {
    res.send(`
        <h1>Home V2_Safe</h1>
        <a href="/signup">Sign Up</a> | <a href="/login">Log In</a>
    `);
});

// Safe Signup
app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ username, password: hashedPassword });

        req.session.username = user.username;
        res.redirect("/members");
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.send("Error: Username already exists. Choose another.");
        }
        console.error("Signup Error:", error);
        res.send("Internal server error. Please try again.");
    }
});

// Login Page
app.get("/login", (req, res) => {
    res.send(`
        <h1>Log In</h1>
        <form action="/login" method="POST">
            <input type="text" name="username" required placeholder="Username"><br>
            <input type="password" name="password" required placeholder="Password"><br>
            <button type="submit">Log In</button>
        </form>
        <a href="/">Home</a>
    `);
});

// Safe Login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) return res.send("Invalid credentials");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("Invalid credentials");

        req.session.username = username;
        res.send(`Logged in as ${username} <a href="/members">Go to Members Area</a>`);
    } catch (error) {
        console.error("Login Error:", error);
        res.send("Internal server error. Please try again.");
    }
});

// Members Page
app.get("/members", (req, res) => {
    if (!req.session.username) return res.redirect("/");

    const images = ["image1.jpeg", "image2.jpeg", "image3.jpeg"];
    const randomImage = images[Math.floor(Math.random() * images.length)];

    res.send(`<h1>Welcome, ${req.session.username}</h1>
    <img src="/${randomImage}" alt="random image" style="width: 300px; height: 300px;"><br>
    <a href="/logout">Logout</a>`);
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// 404 Page
app.use((req, res) => {
    res.status(404).send("<h1>404 - Page Not Found</h1>");
});

// Start Server
app.listen(3000, () => console.log("Server running"));
