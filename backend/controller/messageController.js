const express = require("express");
const Message = require("../model/message");
const User = require("../model/user");
const authenticate = require("../middleware/auth");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/upload/voice", upload.single("audio"), async (req, res) => {
  try {
    const fileUrl = `/images/${req.file.filename}`;

    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error saving the file:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

router.post("/search-chat", authenticate, async (req, res) => {
  try {
    const { chatroomId, query } = req.body;
    const currentUserId = req.user.userId;

    const queryTrimmed = query.trim();

    const chatroom1 = `${currentUserId}_${chatroomId}`;
    const chatroom2 = `${chatroomId}_${currentUserId}`;

    const messages = await Message.find({
      chatroom: { $in: [chatroom1, chatroom2] },
      deletedFor: { $ne: currentUserId },
      hiddenBy: { $ne: currentUserId },
      message: { $regex: queryTrimmed, $options: "i" },
    })
      .populate("sender", "name profile")
      .populate("receiver", "name profile")
      .sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Search failed", details: error.message });
  }
});

router.get("/archived", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("archivedChats");

    if (!user || !user.archivedChats || user.archivedChats.length === 0) {
      return res.json([]);
    }

    const otherUserIds = user.archivedChats.map((chatroomId) => {
      const [id1, id2] = chatroomId.split("_");
      return id1 === userId ? id2 : id1;
    });

    const userList = await User.find({ _id: { $in: otherUserIds } }).select(
      "name email profile"
    );

    res.json(userList);
  } catch (err) {
    console.error("Error in fetching archived users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/media/:chatroomId", authenticate, async (req, res, next) => {
  try {
    const otherUserId = req.params.chatroomId;
    const currentUserId = req.user.userId;

    const chatroom1 = `${currentUserId}_${otherUserId}`;
    const chatroom2 = `${otherUserId}_${currentUserId}`;

    const mediaMessages = await Message.find({
      chatroom: { $in: [chatroom1, chatroom2, otherUserId] },
      deletedFor: { $ne: currentUserId },
      hiddenBy: { $ne: currentUserId },
      $or: [
        { "media.url": { $exists: true, $ne: null } },
        { message: { $regex: /(https?:\/\/[^\s]+)/, $options: "i" } },
        { type: "shared_post" },
      ],
    }).sort({ createdAt: -1 });
    res.json(mediaMessages);
  } catch (err) {
    console.error("Error fetching media:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/unarchive", authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { otherUserId } = req.body;
  const chatroom = [userId, otherUserId].sort().join("_");

  await User.findByIdAndUpdate(userId, {
    $pull: { archivedChats: chatroom },
  });

  res.json({ success: true });
});

router.get("/unread-counts", authenticate, async (req, res) => {
  const currentUserId = req.user.userId;

  try {
    const messages = await Message.find({
      chatroom: { $regex: new RegExp(`^.*${currentUserId}.*$`) },
      status: "sent",
    });

    const counts = {};

    messages.forEach((msg) => {
      const senderId = msg.sender.toString();
      counts[senderId] = (counts[senderId] || 0) + 1;
    });

    res.json(counts);
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ error: "Failed to get unread counts" });
  }
});

router.get("/:sender/:receiver", async (req, res, next) => {
  try {
    const { sender, receiver } = req.params;
    const chatroom = [sender, receiver].sort().join("_");

    const messages = await Message.find({
      chatroom,
      hiddenBy: { $ne: sender },
      $or: [
        { isScheduled: { $exists: false } },
        { isScheduled: false },
        {
          $and: [
            { isScheduled: true },
            { scheduledAt: { $lte: new Date() } },
            { sent: true },
          ],
        },
      ],
    })
      .populate("sender", "name profile")
      .populate("receiver", "name profile")
      .populate("sharedProfile", "name profile")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name profile",
        },
      })
      .populate("reactions.user", "name profile")
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching messages" });
  }
});

router.get("/:chatroom", async (req, res, next) => {
  try {
    const { chatroom } = req.params;
    const messages = await Message.find({ chatroom })
      .populate("sender", "name profile")
      .populate("reactions.user", "name profile")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name profile",
        },
      });
    res.json(messages);
  } catch (error) {
    console.error(" Error fetching messages: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId.toString();

    const messages = await Message.find({
      chatroom: { $regex: userId },
      hiddenBy: { $ne: userId },
    })
      .populate("sender", "name email profile")
      .sort({ createdAt: -1 });

    const userMap = new Map();

    const currentUser = await User.findById(userId).select(
      "pinnedUsers archivedChats"
    );
    const archivedChatsSet = new Set(currentUser.archivedChats);

    for (const msg of messages) {
      const [id1, id2] = msg.chatroom.split("_");
      const otherUserId = userId === id1 ? id2 : id1;

      if (archivedChatsSet.has(msg.chatroom)) continue;

      if (!userMap.has(otherUserId)) {
        let userDetails;

        if (msg.sender && msg.sender._id.toString() === otherUserId) {
          userDetails = msg.sender;
        } else {
          userDetails = await User.findById(otherUserId).select(
            "name email profile"
          );
        }

        if (userDetails) {
          userMap.set(otherUserId, {
            _id: userDetails._id,
            name: userDetails.name,
            email: userDetails.email,
            profile: userDetails.profile,
            lastMessageTime: msg.createdAt,
          });
        }
      }
    }

    for (const pinnedUserId of currentUser.pinnedUsers) {
      const chatroomId = [userId, pinnedUserId.toString()].sort().join("_");

      if (archivedChatsSet.has(chatroomId)) {
        continue;
      }

      if (!userMap.has(pinnedUserId.toString())) {
        const userDetails = await User.findById(pinnedUserId).select(
          "name email profile"
        );

        if (userDetails) {
          userMap.set(pinnedUserId.toString(), {
            _id: userDetails._id,
            name: userDetails.name,
            email: userDetails.email,
            profile: userDetails.profile,
            lastMessageTime: new Date(0),
          });
        }
      }
    }

    const userList = Array.from(userMap.values())
      .map((user) => ({
        ...user,
        pinned: currentUser.pinnedUsers.includes(user._id),
      }))
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });

    res.json(userList);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.delete("/:messageId", async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not Found" });

    await Message.findByIdAndDelete(messageId);

    req.app
      .get("socketio")
      .to(message.chatroom)
      .emit("deleteMessage", messageId);

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting message" });
  }
});

router.delete("/user/:chatUserId", authenticate, async (req, res, next) => {
  const currentUserId = req.user.userId;
  const chatUserId = req.params.chatUserId;

  const chatroom1 = `${currentUserId}_${chatUserId}`;
  const chatroom2 = `${chatUserId}_${currentUserId}`;

  try {
    await Message.updateMany(
      {
        chatroom: { $in: [chatroom1, chatroom2] },
      },
      {
        $addToSet: { hiddenBy: currentUserId },
      }
    );
    res.json({ message: "Messages hidden for user" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:messageId/:chatroom", async (req, res, next) => {
  try {
    const { messageId, chatroom } = req.params;
    await Message.findByIdAndDelete(messageId);

    const io = req.app.get("socketio");
    io.to(chatroom).emit("messageDeleted", messageId);

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting message" });
  }
});

router.post("/upload", upload.single("media"), (req, res, next) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const fileType = file.mimetype.startsWith("video") ? "video" : "image";
  res.json({
    url: `images/${file.filename}`,
    type: fileType,
  });
});

router.post("/:chatrooms", authenticate, async (req, res, next) => {
  const { chatrooms } = req.params;
  const { senderId, receiverId, message, post, type, sharedProfile } = req.body;

  try {
    const senderUser = await User.findById(senderId).select("name profile");

    if (!senderUser) return res.status(404).json({ error: "Sender not found" });

    const newMessage = new Message({
      chatroom: chatrooms,
      sender: senderId,
      receiver: receiverId,
      message,
      type: type || "text",
      sharedPost: type === "shared_post" ? post : null,
      sharedProfile: type === "shared_profile" ? sharedProfile : null,
    });

    await newMessage.save();

    const io = req.app.get("socketio");
    io.to(chatrooms).emit("receiveMessage", {
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
      media: null,
      type,
      sharedPost: newMessage.sharedPost || null,
      sharedProfile: newMessage.sharedProfile || null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error sharing post:", err);
    res.status(500).json({ error: "Error sharing post" });
  }
});

router.post("/forward/:messageId", authenticate, async (req, res, next) => {
  const { messageId } = req.params;
  const { receiverId } = req.body;
  const senderId = req.user.userId;

  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const newMessageData = {
      sender: senderId,
      receiver: receiverId,
      chatroom: [senderId, receiverId].sort().join("_"),
      message: originalMessage.message,
      forwardedFrom: originalMessage._id,
      type: originalMessage.type,
    };

    if (originalMessage.media && originalMessage.media.url) {
      newMessageData.media = originalMessage.media;
    }

    if (originalMessage.sharedPost) {
      newMessageData.sharedPost = originalMessage.sharedPost;
    }

    if (originalMessage.sharedProfile) {
      newMessageData.sharedProfile = originalMessage.sharedProfile;
    }

    if (originalMessage.voice.url) {
      newMessageData.voice = originalMessage.voice;
    }
    if (originalMessage.location) {
      newMessageData.location = originalMessage.location;
    }
    const newMessage = new Message(newMessageData);
    await newMessage.save();

    const io = req.app.get("socketio");
    io.to(newMessage.chatroom).emit(
      "receiveMessage",
      await newMessage.populate("sender", "name profile")
    );

    res.json({ message: "Message forwarded successfully", newMessage });
  } catch (error) {
    console.error("Forwarding error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/deleteForMe/:messageId", async (req, res, next) => {
  const { messageId } = req.params;
  const { userId } = req.body;
  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete for me" });
  }
});

router.put("/edit/:id", async (req, res, next) => {
  const { id } = req.params;
  const { userId, newContent } = req.body;

  try {
    const message = await Message.findById(id);
    if (!message) return res.status(404).send("Message not found");

    if (message.sender.toString() !== userId)
      return res.status(403).send("Unauthorized");

    const EDIT_TIME_LIMIT = 15 * 60 * 1000;
    const now = Date.now();
    const messageCreatedAt = new Date(message.createdAt).getTime();

    if (now - messageCreatedAt > EDIT_TIME_LIMIT) {
      return res.status(403).send("Editing time window has passed");
    }

    message.message = newContent;
    message.edited = true;
    await message.save();

    io.to(message.chatroom).emit("messageEdited", {
      messageId: id,
      newContent,
    });

    res.send(message);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.post("/pin/:userId", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    const toPinId = req.params.userId;

    if (!user.pinnedUsers.includes(toPinId)) {
      user.pinnedUsers.push(toPinId);
      await user.save();
    }

    res.status(200).json({ message: "User pinned successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error pinning user" });
  }
});

router.post("/unpin/:userId", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    const toUnpinId = req.params.userId;

    user.pinnedUsers = user.pinnedUsers.filter(
      (id) => id.toString() !== toUnpinId
    );

    await user.save();
    res.status(200).json({ message: "User unpinned successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error unpinning user" });
  }
});

router.post("/archive/:chatroom", authenticate, async (req, res, next) => {
  const userId = req.user.userId;
  const { chatroom } = req.params;

  try {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { archivedChats: chatroom },
    });

    const [id1, id2] = chatroom.split("_");
    const otherUserId = id1 === userId ? id2 : id1;

    await User.findByIdAndUpdate(userId, {
      $pull: { pinnedUsers: otherUserId },
    });

    res.json({
      success: true,
      message: "Chat archived and user unpinned if pinned.",
    });
  } catch (err) {
    console.error("Error archiving chat:", err);
    res.status(500).json({ error: "Failed to archive chat." });
  }
});

router.post("/unarchive/:chatroom", authenticate, async (req, res, next) => {
  const userId = req.user.userId;
  const { chatroom } = req.params;

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { archivedChats: chatroom },
    });
    res.json({ success: true, message: "Chat unarchived." });
  } catch (err) {
    res.status(500).json({ error: "Failed to unarchive chat." });
  }
});

module.exports = router;
