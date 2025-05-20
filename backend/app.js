const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const Message = require("./model/message");
const User = require("./model/user");
const router = require("./router/user");
const postRoute = require("./router/post");
const adminRoute = require("./router/admin");
const notification = require("./controller/notificationController");
const Notification = require("./model/notification");
const messageController = require("./controller/messageController");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["POST", "PUT", "GET", "DELETE", "PATCH"],
  },
});

global.connectedUsers = new Map();
const onlineUsers = new Map();
let activePolls = {};
io.on("connection", async (socket) => {
  socket.on("joinRoom", ({ chatroom, userId }) => {
    socket.join(chatroom);
  });

  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on(
    "sendMessage",
    async ({
      chatroom,
      sender,
      message,
      replyTo,
      media,
      type,
      sharedPost,
      sharedProfile,
      location,
      oneTimeView = false,
      scheduledAt,
    }) => {
      try {
        if (!sender || !mongoose.Types.ObjectId.isValid(sender)) {
          return;
        }

        const senderUser = await User.findById(sender).select("name profile");
        if (!senderUser) {
          return;
        }

        const newMessage = new Message({
          chatroom,
          sender,
          message,
          replyTo,
          media,
          type: type || "text",
          sharedPost: type === "shared_post" ? sharedPost : null,
          sharedProfile: type === "shared_profile" ? sharedProfile : null,
          location: type === "location" ? location : null,
          oneTimeView,
          viewedBy: [],
          isScheduled: !!scheduledAt,
          scheduledAt: scheduledAt || null,
        });

        if (scheduledAt) {
          await newMessage.save();
          return;
        }
        await newMessage.save();

        const [id1, id2] = chatroom.split("_");
        const receiverId = sender === id1 ? id2 : id1;

        if (chatroom.includes("general" || "adventure" || "travel")) {
          const allUsers = await User.find({
            _id: { $ne: senderUser._id },
          }).select("_id");

          for (const user of allUsers) {
            const notification = new Notification({
              userId: user._id,
              senderId: senderUser._id,
              message: `${senderUser.name} sent a message.`,
              read: false,
            });

            await notification.save();

            const targetSocketId = global.connectedUsers.get(
              user._id.toString()
            );

            if (targetSocketId) {
              io.to(targetSocketId).emit("notifications", {
                type: "single",
                data: notification,
              });
            }
          }
        } else {
          const notification = new Notification({
            userId: receiverId,
            senderId: senderUser._id,
            message: `${senderUser.name} sent a message.`,
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
        }

        io.to(chatroom).emit("receiveMessage", {
          _id: newMessage._id,
          status: "sent",
          sender: {
            _id: senderUser._id,
            name: senderUser.name,
            profile: senderUser.profile,
          },
          message: newMessage.message,
          timestamp: newMessage.timestamp,
          replyTo: replyTo || null,
          media: newMessage.media || null,
          type,
          location: newMessage.location || null,
          sharedPost: newMessage.sharedPost || null,
          sharedProfile: newMessage.sharedProfile || null,
          oneTimeView: newMessage.oneTimeView,
          viewedBy: newMessage.viewedBy,
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  );

  socket.on("viewOneTimeMessage", async ({ messageId, userId }) => {
    const message = await Message.findById(messageId);
    if (!message.viewedBy.includes(userId)) {
      message.viewedBy.push(userId);
      await message.save();

      io.to(message.chatId).emit("messageViewed", {
        messageId,
        userId,
      });
    }
  });

  socket.on("createPoll", async ({ chatRoomId, question, options, userId }) => {
    if (!chatRoomId || !question || !options || !userId) {
      console.error("Missing required data :", {
        chatRoomId,
        question,
        options,
        userId,
      });
      return;
    }

    const pollId = `${chatRoomId}-${Date.now()}`;
    const poll = {
      question,
      options: options.map((option) => ({ optionText: option, votes: [] })),
    };

    try {
      const newMessage = new Message({
        chatroom: chatRoomId,
        sender: userId,
        message: question,
        type: "poll",
        poll: {
          question,
          options: poll.options,
        },
      });

      const savedMessage = await newMessage.save();

      if (!savedMessage) {
        throw new Error("Failed to save the poll message");
      }

      io.to(chatRoomId).emit("newPoll", {
        _id: savedMessage._id,
        question,
        options: poll.options,
        votedUsers: {},
      });

      activePolls[pollId] = poll;
    } catch (error) {
      console.error("Error creating poll:", error);
    }
  });

  socket.on("votePoll", async ({ pollId, optionIndex, sender }) => {
    try {
      const message = await Message.findById(pollId);

      if (message && message.poll) {
        const poll = message.poll;

        poll.options.forEach((option) => {
          option.votes = option.votes.filter(
            (voterId) => voterId.toString() !== sender.toString()
          );
        });

        poll.options[optionIndex].votes.push(sender);

        if (!poll.votedUsers) {
          poll.votedUsers = {};
        }
        poll.votedUsers[sender] = optionIndex;

        await message.save();

        io.to(message.chatroom).emit("pollUpdated", {
          _id: pollId,
          options: poll.options,
          votedUsers: poll.votedUsers,
        });
      }
    } catch (error) {
      console.error("Error handling vote:", error);
    }
  });

  socket.on(
    "sendVoiceMessage",
    async ({ senderId, chatroomId, voiceFileUrl, voiceDuration }) => {
      const senderUser = await User.findById(senderId).select("name profile");
      const message = await Message.create({
        sender: senderId,
        message: "voice message",
        chatroom: chatroomId,
        type: "voice",
        voice: {
          url: voiceFileUrl,
          duration: voiceDuration,
        },
        timestamp: new Date(),
      });
      await message.save();

      io.to(chatroomId).emit("receiveMessage", {
        _id: message._id,
        message: message.message,
        status: "sent",
        sender: {
          _id: senderUser._id,
          name: senderUser.name,
          profile: senderUser.profile,
        },
        timestamp: message.timestamp,
        replyTo: null,
        media: message.media || null,
        type: "voice",
        voice: {
          url: voiceFileUrl,
          duration: voiceDuration,
        },
        sharedPost: message.sharedPost || null,
      });
    }
  );

  socket.on(
    "sendBroadcast",
    async ({ sender, message, media, type, sharedPost, recipients }) => {
      try {
        const senderUser = await User.findById(sender).select("name profile");

        for (const receiver of recipients) {
          const chatroom = [sender, receiver].sort().join("_");

          const newMessage = new Message({
            chatroom,
            sender,
            receiver,
            message,
            media,
            type: type || "text",
            sharedPost: type === "shared_post" ? sharedPost : null,
          });

          await newMessage.save();

          io.to(chatroom).emit("receiveMessage", {
            _id: newMessage._id,
            status: "sent",
            sender: {
              _id: senderUser._id,
              name: senderUser.name,
              profile: senderUser.profile,
            },
            message: newMessage.message,
            timestamp: newMessage.timestamp,
            replyTo: null,
            media: newMessage.media || null,
            type,
            sharedPost: newMessage.sharedPost || null,
          });
        }
      } catch (err) {
        console.error("Broadcast error:", err);
      }
    }
  );

  socket.on("pinMessage", async ({ messageId, userId }) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(messageId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      )
        return;

      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { pinnedBy: userId } },
        { new: true }
      );

      io.to(updatedMessage.chatroom).emit("messagePinned", {
        messageId,
        userId,
      });
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  });

  socket.on("unpinMessage", async ({ messageId, userId }) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(messageId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      )
        return;

      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { $pull: { pinnedBy: userId } },
        { new: true }
      );

      io.to(updatedMessage.chatroom).emit("messageUnpinned", {
        messageId,
        userId,
      });
    } catch (err) {
      console.error("Error unpinning message:", err);
    }
  });

  socket.on(
    "editMessage",
    async ({ messageId, newContent, chatroom, senderSocketId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const EDIT_TIME_LIMIT = 15 * 60 * 1000;
        const now = Date.now();
        const messageCreatedAt = new Date(message.createdAt).getTime();

        if (now - messageCreatedAt > EDIT_TIME_LIMIT) {
          io.to(senderSocketId).emit("editError", {
            messageId,
            error: "Editing time has passed",
          });
          return;
        }

        message.message = newContent;
        message.edited = true;
        await message.save();

        const updatedMessage = await Message.findById(messageId).populate(
          "sender replyTo"
        );

        io.to(chatroom).emit("messageEdited", updatedMessage);
      } catch (error) {
        console.error("Edit error:", error);
      }
    }
  );

  socket.on("reactMessage", async ({ messageId, userId, emoji }) => {
    const message = await Message.findById(messageId);

    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== userId
    );

    message.reactions.push({ user: userId, emoji });

    await message.save();

    const updatedMessage = await Message.findById(messageId).populate(
      "reactions.user",
      "name profile"
    );

    io.to(updatedMessage.chatroom).emit("messageReaction", {
      messageId,
      reactions: updatedMessage.reactions,
    });
  });

  socket.on("messageSeen", async ({ messageIds, viewerId }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { status: "seen" } }
      );

      for (let messageId of messageIds) {
        const msg = await Message.findById(messageId);
        if (msg && msg.sender.toString() !== viewerId) {
          const senderSocketId = onlineUsers.get(msg.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("messageSeen", {
              viewerId,
              messageIds,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error updating seen messages", err);
    }
  });

  socket.on("removeReaction", async ({ messageId, userId }) => {
    const message = await Message.findById(messageId);
    if (message) {
      message.reactions = message.reactions.filter(
        (r) => r.user.toString() !== userId.toString()
      );

      await message.save();

      const updatedMessage = await Message.findById(messageId).populate(
        "reactions.user",
        "name profile"
      );
      io.to(updatedMessage.chatroom).emit("messageReaction", {
        messageId,
        reactions: updatedMessage.reactions,
      });
    }
  });

  socket.on("typing", ({ chatroom, sender, receiver }) => {
    socket.to(chatroom).emit("typing", { sender });
  });

  socket.on("deleteMessage", async ({ chatroom, messageId }) => {
    io.to(chatroom).emit("deleteMessage", messageId);
  });

  socket.on("register", async (userId) => {
    global.connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.on("fetchNotifications", async (userId) => {
      try {
        const notifications = await Notification.find({
          userId,
          isRead: false,
        }).sort({ createdAt: -1 });
        socket.emit("notifications", { type: "bulk", data: notifications });
      } catch (error) {
        console.error(" Error fetching notifications:", error);
      }
    });
    try {
      const unreadNotifications = await Notification.find({
        userId,
        isRead: false,
      });

      if (unreadNotifications.length > 0) {
        io.to(socket.id).emit("notifications", {
          type: "bulk",
          data: unreadNotifications,
        });
      }
    } catch (error) {
      console.error(" Error fetching unread notifications : ", error);
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "PUT", "GET", "DELETE", "PATCH"],
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(router);
app.use(postRoute);
app.use(adminRoute);
app.use(notification);
app.use("/messages", messageController);

app.set("socketio", io);
require("./scheduledJob")(io);

mongoose
  .connect(
    "mongodb+srv://mansigajera2512:h8KYuSDiqjeF4YTE@cluster0.gwch9.mongodb.net/practice?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    server.listen(8000);
  })
  .catch((err) => console.log("Database connection error:", err));

module.exports = { io };
