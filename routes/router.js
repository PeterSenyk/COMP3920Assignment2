const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Sequelize User model

// Home Page
router.get("/", (req, res) => {
    res.render("home"); // Render home.ejs
});

// Login Page
router.get("/login", (req, res) => {
    res.render("login"); // Render login.ejs
});

// Handle Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) return res.render("login", { errorMessage: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.render("login", { errorMessage: "Invalid credentials" });

        req.session.username = username;
        res.redirect("/chat");
    } catch (error) {
        console.error("Login Error:", error);
        res.render("login", { errorMessage: "Internal server error" });
    }
});

// Signup Page
router.get("/signup", (req, res) => {
    res.render("signup"); // Render signup.ejs
});

// Handle Signup
router.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ username, password: hashedPassword });

        req.session.username = username;
        res.redirect("/chat");
    } catch (error) {
        res.render("signup", { errorMessage: "Username already exists" });
    }
});

// Chat Page (Protected Route)
router.get("/chat", (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.render("chat", { username: req.session.username });
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// Export Router
module.exports = router;
