const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Sequelize User model

// Home Page
router.get("/", (req, res) => {
    res.render("home"); // Render home.ejs
});

// Login Page - Show login form
router.get("/login", (req, res) => {
    res.render("login", { errorMessage: null }); // Ensure errorMessage is always defined
});

// Handle Login Form Submission
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.render("login", { errorMessage: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.render("login", { errorMessage: "Invalid credentials" });
        }

        req.session.username = user.username;
        req.session.userId = user.user_id;

        res.redirect("/chat");
    } catch (error) {
        console.error("Login Error:", error);
        res.render("login", { errorMessage: "Internal server error" });
    }
});

// Signup Page - Show signup form
router.get("/signup", (req, res) => {
    res.render("signup", { errorMessage: null }); // Ensure errorMessage is always passed
});

// Handle Signup Form Submission
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body; // ✅ Get email from the form
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Ensure email is included when creating a new user
        await User.create({ username, email, password_hash: hashedPassword });

        req.session.username = username;
        res.redirect("/chat");
    } catch (error) {
        console.error("Signup Error:", error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.render("signup", { errorMessage: "Username or email already exists. Choose another." });
        }

        res.render("signup", { errorMessage: "Internal server error. Please try again." });
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
