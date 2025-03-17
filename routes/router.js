const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User, Room, RoomUser, Message, Emoji, MessageReaction } = require('../models');

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

            // console.log(`Room: ${room.name} (ID: ${room.room_id}) - Unread Messages: ${unreadMessages}, Last Read ID: ${roomUser.last_read_message_id}`);
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
router.get('/room/:roomId', async (req, res) => {
    // 1) Check login
    if (!req.session.username) {
        return res.redirect('/login');
    }

    try {
        // 2) Get the logged-in user
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) return res.redirect('/login');

        // 3) Get the requested room
        const roomId = parseInt(req.params.roomId, 10);
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).send('Room not found');
        }

        // 4) Ensure the user is in this room
        const roomUser = await RoomUser.findOne({
            where: { user_id: user.user_id, room_id: roomId },
            attributes: ['room_user_id', 'last_read_message_id'],
        });
        if (!roomUser) {
            return res.status(403).send('You are not part of this room');
        }

        // 5) Fetch all rooms for the sidebar
        const userRoomsData = await RoomUser.findAll({
            where: { user_id: user.user_id },
            attributes: ['room_id', 'last_read_message_id'],
        });
        const roomIds = userRoomsData.map(r => r.room_id);
        const userRooms = await Room.findAll({ where: { room_id: roomIds } });

        // 6) Get all RoomUser IDs for this room
        const roomUserIds = (await RoomUser.findAll({
            where: { room_id: roomId },
            attributes: ['room_user_id'],
        })).map(r => r.room_user_id);

        // 7) Fetch messages in this room including:
        //    - The RoomUser (with the User info)
        //    - Any associated Emojis (via MessageReaction)
        const messages = await Message.findAll({
            where: { room_user_id: { [Op.in]: roomUserIds } },
            order: [['sent_datetime', 'ASC']],
            include: [
                { model: RoomUser, include: [User] },
                { model: Emoji, through: { attributes: ['user_id'] } },
            ],
        });

        // 8) Optionally update last_read_message_id for the user
        const lastMessage = messages.length ? messages[messages.length - 1] : null;
        if (lastMessage) {
            await RoomUser.update(
                { last_read_message_id: lastMessage.message_id },
                { where: { user_id: user.user_id, room_id: roomId } }
            );
        }

        // 9) Fetch the full list of emojis for the reaction picker
        const allEmojis = await Emoji.findAll();

        // 10) Render the chat page once, passing all variables
        return res.render('chat', {
            username: req.session.username,
            room_id: roomId,
            rooms: userRooms,
            messages,
            last_read_message_id: roomUser.last_read_message_id || 0,
            allEmojis,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).send('Internal server error');
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


router.post('/messages/:messageId/react', async (req, res) => {
    try {
        // Extract form data
        const messageId = parseInt(req.params.messageId, 10);
        const { emojiId, roomId } = req.body;
        const userId = req.session.userId;  // assuming you store userId in session

        // Optional: check that the message/emoji exist, or that user is allowed.
        const message = await Message.findByPk(messageId);
        if (!message) {
            return res.status(404).send('Message not found');
        }

        // Usually you'd confirm `emojiId` is valid too:
        const emoji = await Emoji.findByPk(emojiId);
        if (!emoji) {
            return res.status(404).send('Emoji not found');
        }

        // Create row in pivot table (MessageReaction)
        // If you want "toggle" behavior, you'd check if row exists first, then remove.
        await MessageReaction.create({
            message_id: messageId,
            emoji_id: emojiId,
            user_id: userId,
        });

        // Redirect back to the room
        return res.redirect(`/room/${roomId}`);
    } catch (error) {
        console.error('Reaction creation error:', error);
        return res.status(500).send('Error adding reaction');
    }
});

// Create a new room
router.post('/createRoom', async (req, res) => {
    try {
        // Get the room name from the form submission
        const { roomName } = req.body;

        // Create a new Room (assuming the Room model has a 'name' field)
        const room = await Room.create({ name: roomName });

        // Optionally, add the current user to this room.
        // This step ensures that the creator is automatically a member of the room.
        const user = await User.findOne({ where: { username: req.session.username } });
        if (user) {
            await RoomUser.create({
                user_id: user.user_id,
                room_id: room.room_id
            });
        }

        // Redirect the user to the new room's chat page
        res.redirect(`/room/${room.room_id}`);
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
