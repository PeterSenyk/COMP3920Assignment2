const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User, Room, RoomUser, Message } = require("../models");

// Home Page
router.get("/", (req, res) => {
    res.render("home");
});

// Login Page
router.get("/login", (req, res) => {
    res.render("login", { errorMessage: null });
});

// Handle Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
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

// Signup Page
router.get("/signup", (req, res) => {
    res.render("signup", { errorMessage: null });
});

// Handle Signup
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ username, email, password_hash: hashedPassword });

        req.session.username = username;
        res.redirect("/chat");
    } catch (error) {
        console.error("Signup Error:", error);
        res.render("signup", { errorMessage: "Username or email already exists." });
    }
});

// Chat Page - Fetch Rooms
router.get("/chat", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect("/login");

        const userRooms = await Room.findAll({
            where: {
                room_id: {
                    [Op.in]: (await RoomUser.findAll({
                        attributes: ["room_id"],
                        where: { user_id: user.user_id }
                    })).map(roomUser => roomUser.room_id)
                }
            }
        });

        res.render("chat", { username: req.session.username, rooms: userRooms, messages: [], room_id: null });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.render("chat", { username: req.session.username, rooms: [], messages: [], room_id: null });
    }
});

// Room Chat Page - Fetch Messages
router.get("/room/:roomId", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect("/login");

        const room = await Room.findOne({ where: { room_id: req.params.roomId } });
        if (!room) return res.status(404).send("Room not found");

        const messages = await Message.findAll({
            where: { room_id: req.params.roomId },
            include: [{ model: RoomUser, include: [User] }],
            order: [["sent_datetime", "ASC"]]
        });

        res.render("chat", { username: req.session.username, room_id: req.params.roomId, rooms: [], room, messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.render("chat", { username: req.session.username, room_id: null, rooms: [], room: null, messages: [] });
    }
});

// Send Message
router.post("/sendMessage", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const { message, roomId } = req.body;
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect("/login");

        await Message.create({ room_id: roomId, text: message });

        res.redirect(`/room/${roomId}`);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send("Internal server error");
    }
});

// Create Room and Add Creator
router.post("/createRoom", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const { roomName } = req.body;
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect("/login");

        const newRoom = await Room.create({ name: roomName });
        await RoomUser.create({ user_id: user.user_id, room_id: newRoom.room_id });

        res.redirect("/chat");
    } catch (error) {
        console.error("Error creating room:", error);
        res.redirect("/chat");
    }
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
