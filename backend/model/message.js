const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatroom: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    message: {
      type: String,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "seen"],
      default: "sent",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reactions: [
      {
        emoji: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    hiddenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    media: {
      url: {
        type: String,
        required: false,
      },
      type: {
        type: String,
        enum: ["image", "video", "file"],
      },
      name: String,
    },
    sharedPost: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    type: {
      type: String,
      enum: [
        "text",
        "media",
        "shared_post",
        "shared_profile",
        "voice",
        "location",
        "poll",
      ],
      default: "text",
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    edited: { type: Boolean, default: false },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],
    sharedProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    voice: {
      url: {
        type: String,
        required: false,
      },
      duration: {
        type: Number,
        required: false,
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
      },
      name: String,
      mapUrl: String,
    },
    poll: {
      question: String,
      options: [
        {
          optionText: String,
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          votedUsers: { type: Map, of: Number },
        },
      ],
    },
    oneTimeView: { type: Boolean, default: false },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isScheduled: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
