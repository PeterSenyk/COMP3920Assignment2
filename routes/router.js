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

// Chat Page - Fetch Rooms & Unread Messages
router.get("/chat", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect("/login");

        const userRoomsData = await RoomUser.findAll({
            where: { user_id: user.user_id },
            attributes: ["room_id", "last_read_message_id", "room_user_id"]
        });

        if (userRoomsData.length === 0) {
            return res.render("chat", {
                username: req.session.username,
                rooms: [],
                messages: [],
                room_id: null
            });
        }

        const roomIds = userRoomsData.map(roomUser => roomUser.room_id);
        const userRooms = await Room.findAll({ where: { room_id: roomIds } });

        for (let room of userRooms) {
            const roomUser = userRoomsData.find(r => r.room_id === room.room_id);

            if (!roomUser) {
                room.dataValues.unreadMessages = 0;
                continue;
            }

            const roomUserIds = (await RoomUser.findAll({
                where: { room_id: room.room_id },
                attributes: ["room_user_id"]
            })).map(r => r.room_user_id);

            const unreadMessages = await Message.count({
                where: {
                    room_user_id: { [Op.in]: roomUserIds },  // Count all users in room
                    message_id: { [Op.gt]: roomUser.last_read_message_id || 0 }
                }
            });

            room.unreadMessages = unreadMessages;

            console.log(`🔎 Room: ${room.name} (ID: ${room.room_id}) - Unread Messages: ${unreadMessages}, Last Read ID: ${roomUser.last_read_message_id}`);
        }

        res.render("chat", {
            username: req.session.username,
            rooms: userRooms,
            messages: [],
            room_id: null
        });

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

        const room = await Room.findByPk(req.params.roomId);
        if (!room) return res.status(404).send("Room not found");

        const userRoomsData = await RoomUser.findAll({
            where: { user_id: user.user_id },
            attributes: ["room_id", "last_read_message_id"]
        });

        const roomIds = userRoomsData.map(r => r.room_id);
        const userRooms = await Room.findAll({ where: { room_id: roomIds } });

        const roomUser = await RoomUser.findOne({
            where: { user_id: user.user_id, room_id: req.params.roomId },
            attributes: ["room_user_id", "last_read_message_id"]
        });

        console.log(`User's last read message ID in room ${req.params.roomId}:`, roomUser?.last_read_message_id);

        const roomUserIds = (await RoomUser.findAll({ where: { room_id: req.params.roomId }, attributes: ["room_user_id"] })).map(r => r.room_user_id);
        const messages = await Message.findAll({
            where: { room_user_id: roomUserIds },
            include: [{ model: RoomUser, include: [{ model: User }] }],
            order: [["sent_datetime", "ASC"]]
        });

        const lastMessage = await Message.findOne({
            where: { room_user_id: roomUserIds },
            order: [["sent_datetime", "DESC"]],
            attributes: ["message_id"]
        });

        console.log(`Latest message in room ${req.params.roomId}:`, lastMessage?.message_id);

        res.render("chat", {
            username: req.session.username,
            room_id: req.params.roomId,
            messages,
            rooms: userRooms,
            last_read_message_id: roomUser?.last_read_message_id || 0
        });

        if (lastMessage) {
            await RoomUser.update(
                { last_read_message_id: lastMessage.message_id },
                { where: { user_id: user.user_id, room_id: req.params.roomId } }
            );
            console.log(`pdated last_read_message_id for user ${user.user_id} in room ${req.params.roomId} to ${lastMessage.message_id}`);
        }

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal server error");
    }
});

// Invite a user to a room
router.post("/inviteUser", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const { roomId, username } = req.body;
        const invitingUser = await User.findOne({ where: { username: req.session.username } });
        if (!invitingUser) return res.redirect("/login");

        const invitedUser = await User.findOne({ where: { username } });
        if (!invitedUser) {
            return res.status(404).send("User not found.");
        }

        const existingRoomUser = await RoomUser.findOne({
            where: { user_id: invitedUser.user_id, room_id: roomId }
        });

        if (existingRoomUser) {
            return res.status(400).send("User is already in this room.");
        }

        await RoomUser.create({ user_id: invitedUser.user_id, room_id: roomId });

        res.redirect(`/room/${roomId}`);
    } catch (error) {
        console.error("Error inviting user:", error);
        res.status(500).send("Internal server error");
    }
});

// Send Message
router.post("/sendMessage", async (req, res) => {
    if (!req.session.username) return res.redirect("/login");

    try {
        const { message, roomId } = req.body;
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect("/login");

        const roomUser = await RoomUser.findOne({
            where: { user_id: user.user_id, room_id: roomId }
        });

        if (!roomUser) return res.status(403).send("You are not part of this room.");

        await Message.create({
            room_user_id: roomUser.room_user_id,
            text: message
        });

        res.redirect(`/room/${roomId}`);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send("Internal server error");
    }
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
