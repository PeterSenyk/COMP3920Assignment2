// models/index.js
const User = require('./User');
const Room = require('./Room');
const RoomUser = require('./RoomUser');
const Message = require('./Message');
const Emoji = require('./Emoji');
const MessageReaction = require('./MessageReaction');

// 1) User <-> RoomUser <-> Room
User.hasMany(RoomUser, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RoomUser.belongsTo(User, { foreignKey: 'user_id' });

Room.hasMany(RoomUser, { foreignKey: 'room_id', onDelete: 'CASCADE' });
RoomUser.belongsTo(Room, { foreignKey: 'room_id' });

// Many-to-Many relationship: User <-> Room (through RoomUser)
User.belongsToMany(Room, {
    through: RoomUser,
    foreignKey: 'user_id',
    otherKey: 'room_id',
});
Room.belongsToMany(User, {
    through: RoomUser,
    foreignKey: 'room_id',
    otherKey: 'user_id',
});

// 2) RoomUser <-> Message
RoomUser.hasMany(Message, { foreignKey: 'room_user_id' });
Message.belongsTo(RoomUser, { foreignKey: 'room_user_id' });

// 3) Message <-> Emoji (through MessageReaction)
Message.belongsToMany(Emoji, {
    through: MessageReaction,
    foreignKey: 'message_id',
});
Emoji.belongsToMany(Message, {
    through: MessageReaction,
    foreignKey: 'emoji_id',
});

// If you ever need direct association between MessageReaction and User,
// you can define it here as well, but typically the pivot table columns
// don’t require an explicit belongsTo unless needed in your code.

module.exports = {
    User,
    Room,
    RoomUser,
    Message,
    Emoji,
    MessageReaction,
};
