const cron = require("node-cron");
const Message = require("./model/message");
const User = require("./model/user");
const Notification = require("./model/notification");

module.exports = function (io) {
  cron.schedule("*/10 * * * * *", async () => {
    const now = new Date();
    const dueMessages = await Message.find({
      isScheduled: true,
      scheduledAt: { $lte: now },
      sent: { $ne: true },
    }).populate("sender", "name profile");

    for (const msg of dueMessages) {
      msg.sent = true;
      await msg.save();

      const [id1, id2] = msg.chatroom.split("_");
      const receiverId = msg.sender._id.toString() === id1 ? id2 : id1;

      const notification = new Notification({
        userId: receiverId,
        senderId: msg.sender._id,
        message: `${msg.sender.name} sent a message.`,
        read: false,
      });
      await notification.save();

      const targetSocketId = global.connectedUsers.get(receiverId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("notifications", {
          type: "single",
          data: notification,
        });
      }

      io.to(msg.chatroom).emit("receiveMessage", {
        _id: msg._id,
        status: "sent",
        sender: {
          _id: msg.sender._id,
          name: msg.sender.name,
          profile: msg.sender.profile,
        },
        message: msg.message,
        timestamp: msg.timestamp,
        replyTo: msg.replyTo || null,
        media: msg.media || null,
        type: msg.type || "text",
        location: msg.location || null,
        sharedPost: msg.sharedPost || null,
        sharedProfile: msg.sharedProfile || null,
        oneTimeView: msg.oneTimeView,
        viewedBy: msg.viewedBy,
      });
    }
  });
};
