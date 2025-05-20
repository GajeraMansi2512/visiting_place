import { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../css/chat.css";
import defaultProfile from "../profile.png";
import Header from "../header";
import EmojiPicker from "@emoji-mart/react";
import { FiSend } from "react-icons/fi";
import { FaLocationDot, FaReply } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { BiPin, BiSearch } from "react-icons/bi";
import { MdAttachFile } from "react-icons/md";
import VoiceRecorder from "./voiceRecorder";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const socket = io("http://localhost:8000");

const DirectChat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [swipedMessage, setSwipedMessage] = useState(null);
  const [startX, setStartX] = useState(0);
  const messageContainerRef = useRef(null);
  const userId = sessionStorage.getItem("userId");
  const { user, receiverid } = useParams();
  const [showPicker, setShowPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const token = sessionStorage.getItem("token");
  const [users, setUsers] = useState();
  const [receiverTyping, setReceiverTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [swipeDiff, setSwipeDiff] = useState(0);
  const swipeThreshold = 100;
  const messagesEndRef = useRef(null);
  const [longPressTimeout, setLongPressTimeout] = useState(null);
  const [selectedReactionInfo, setSelectedReactionInfo] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [BlockUser, SetBlockuser] = useState([]);
  const messageRefs = useRef({});
  const [highlightedId, setHighlightedId] = useState(null);
  const [right, setright] = useState(false);
  const navigate = useNavigate();
  const hasLoadedRef = useRef(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();
  const [isOneTime, setIsOneTime] = useState(false);
  const [viewingMessages, setViewingMessages] = useState([]);
  const [viewedMessages, setViewedMessages] = useState([]);
  const [scheduledTime, setScheduledTime] = useState();

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderMessageWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text?.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1e90ff", textDecoration: "underline" }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    if (hasLoadedRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      hasLoadedRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    socket.emit("user-online", userId);

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online-users");
    };
  }, [userId]);

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(messageId);

      setTimeout(() => setHighlightedId(null), 2000);
    }
  };
  useEffect(() => {
    if (userId && receiverid) {
      axios
        .get(`http://localhost:8000/messages/${userId}/${receiverid}`)
        .then((res) => {
          setMessages(res.data);
          hasLoadedRef.current = true;
        });

      socket.emit("joinRoom", {
        chatroom: [userId, receiverid].sort().join("_"),
        userId,
      });

      socket.on("receiveMessage", (newMessage) => {
        setMessages((prev) => [
          ...prev,
          { ...newMessage, viewedBy: newMessage.viewedBy || [] },
        ]);
        hasLoadedRef.current = true;
      });

      socket.on("messageReaction", ({ messageId, reactions }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          )
        );
      });
      socket.on("editError", ({ messageId, error }) => {
        alert(error);
      });
      socket.on("messageSeen", ({ viewerId, messageIds }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id) ? { ...msg, status: "seen" } : msg
          )
        );
      });

      socket.on("messageViewedOnce", ({ messageId, userId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId && !msg.viewedBy?.includes(userId)
              ? { ...msg, viewedBy: [...(msg.viewedBy || []), userId] }
              : msg
          )
        );
      });

      socket.on("typing", ({ sender }) => {
        if (sender === receiverid) {
          setReceiverTyping(true);

          setTimeout(() => {
            setReceiverTyping(false);
          }, 3000);
        }
      });

      socket.on("deleteMessage", (messageId) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      });

      return () => {
        socket.off("receiveMessage");
        socket.off("deleteMessage");
        socket.off("messageReaction");
        socket.off("messageSeen");
        socket.off("typing");
        socket.off("editError");
        socket.off("messageViewedOnce");
      };
    }
  }, [userId, receiverid]);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNewMessageNotification = (data) => {
      setNotifications((prev) => [...prev, data]);
    };

    socket.on("newMessageNotification", handleNewMessageNotification);

    return () => {
      socket.off("newMessageNotification", handleNewMessageNotification);
    };
  }, []);

  const removeReaction = (messageId) => {
    socket.emit("removeReaction", {
      messageId,
      userId,
    });
  };
  const reactToMessage = (messageId, emoji) => {
    const message = messages.find((msg) => msg._id === messageId);

    const existingReaction = message?.reactions?.find(
      (r) => r.user === userId && r.emoji === emoji
    );

    if (existingReaction) {
      socket.emit("removeReaction", {
        messageId,
        userId,
      });
    } else {
      socket.emit("reactMessage", {
        messageId,
        userId,
        emoji,
      });
    }
  };

  const Block = (userId) => {
    fetch(`http://localhost:8000/${userId}/block`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(() => {
        SetBlockuser((prev) => prev.filter((user) => user._id !== userId));
        GetBlockUser();
      });
  };

  useEffect(() => {
    axios
      .get(`http://localhost:8000/users/${user}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    if (isSameDay(messageDate, today)) return "Today";
    if (isSameDay(messageDate, yesterday)) return "Yesterday";

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return messageDate.toLocaleDateString(undefined, options);
  };

  const handleViewOnce = (messageId) => {
    setViewingMessages((prev) => [...prev, messageId]);

    setTimeout(() => {
      setViewingMessages((prev) => prev.filter((id) => id !== messageId));
      setViewedMessages((prev) => [...prev, messageId]);

      socket.emit("viewOneTimeMessage", { messageId, userId });
    }, 10000);
  };

  const sendMessage = async () => {
    hasLoadedRef.current = false;

    if (!message.trim() && !selectedMedia) return;

    let mediaData = null;

    if (selectedMedia) {
      const formData = new FormData();
      formData.append("media", selectedMedia.file);

      try {
        const res = await axios.post(
          "http://localhost:8000/messages/upload",
          formData
        );
        mediaData = {
          url: res.data.url,
          type: selectedMedia.type,
          name: selectedMedia.file.name,
        };
      } catch (err) {
        console.error("Upload failed:", err);
        return;
      }
    }

    const payload = {
      chatroom: [userId, receiverid].sort().join("_"),
      sender: userId,
      message,
      replyTo,
      media: mediaData,
      oneTimeView: isOneTime,
      scheduledAt: scheduledTime || null,
    };
    console.log(payload);
    if (editMode) {
      socket.emit("editMessage", {
        messageId: editMessageId,
        newContent: message,
        chatroom: [userId, receiverid].sort().join("_"),
        senderSocketId: socket.id,
      });

      setEditMode(false);
      setEditMessageId(null);
      setMessage("");
      return;
    }
    socket.emit("sendMessage", {
      chatroom: [userId, receiverid].sort().join("_"),
      sender: userId,
      message,
      replyTo,
      media: mediaData,
      oneTimeView: isOneTime,
      scheduledAt: scheduledTime || null,
    });

    setMessage("");
    setSelectedMedia(null);
    setReplyTo(null);
    setScheduledTime(null);
  };
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  const sendLocationMessage = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const locationData = {
          type: "Point",
          coordinates: [longitude, latitude],
          name: "Current Location",
          mapUrl: `https://maps.google.com?q=${latitude},${longitude}`,
        };

        socket.emit("sendMessage", {
          chatroom: [userId, receiverid].sort().join("_"),
          sender: userId,
          type: "location",
          location: locationData,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  useEffect(() => {
    socket.on("messageEdited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg))
      );
    });

    return () => {
      socket.off("messageEdited");
    };
  }, []);

  const deleteMessage = async (msgId) => {
    try {
      await axios.delete(`http://localhost:8000/messages/${msgId}`);

      socket.emit("deleteMessage", {
        chatroom: [userId, receiverid].sort().join("_"),
        messageId: msgId,
      });

      setSwipedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        messageContainerRef.current &&
        !messageContainerRef.current.contains(event.target)
      ) {
        setSwipedMessage(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsSeen();
    }
  }, [messages]);

  const markMessagesAsSeen = () => {
    const unseen = messages
      .filter((msg) => msg.sender._id === receiverid && msg.status !== "seen")
      .map((msg) => msg._id);

    if (unseen.length > 0) {
      socket.emit("messageSeen", { messageIds: unseen, viewerId: userId });

      setMessages((prev) =>
        prev.map((msg) =>
          unseen.includes(msg._id) ? { ...msg, status: "seen" } : msg
        )
      );
    }
  };

  const deleteForMe = async (msgId) => {
    try {
      await axios.put(`http://localhost:8000/messages/deleteForMe/${msgId}`, {
        userId,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === msgId
            ? { ...msg, deletedFor: [...(msg.deletedFor || []), userId] }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to delete message for me :", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let type = "file";
    if (file.type.startsWith("image")) type = "image";
    else if (file.type.startsWith("video")) type = "video";

    const previewURL = URL.createObjectURL(file);
    setSelectedMedia({ file, previewURL, type });
  };

  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const GetBlockUser = () => {
    fetch(`http://localhost:8000/block`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((user) => {
        SetBlockuser(user.block);
      });
  };

  useEffect(() => {
    GetBlockUser();
    BlockByUser();
  }, []);

  const BlockByUser = () => {
    fetch(`http://localhost:8000/blockbyuser/${receiverid}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setright(data);
      });
  };

  useEffect(() => {
    GetBlockUser();
  }, []);

  useEffect(() => {
    socket.on("messagePinned", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                pinnedBy: msg.pinnedBy.includes(userId)
                  ? msg.pinnedBy
                  : [...msg.pinnedBy, userId],
              }
            : msg
        )
      );
    });

    socket.on("messageUnpinned", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                pinnedBy: msg.pinnedBy.filter((id) => id !== userId),
              }
            : msg
        )
      );
    });

    return () => {
      socket.off("messagePinned");
      socket.off("messageUnpinned");
    };
  }, []);

  const handlePinToggle = (msgId, isPinned) => {
    if (isPinned) {
      socket.emit("unpinMessage", {
        messageId: msgId,
        userId,
      });
    } else {
      socket.emit("pinMessage", {
        messageId: msgId,
        userId,
      });
    }
  };
  let lastRenderedDate = null;
  const chatroomId = [userId, receiverid].sort().join("_");

  return (
    <>
      <Header />
      <div className="chat-container">
        <div className="chat-header">
          <div style={{ display: "flex" }}>
            <Link to={`/${receiverid}/account`} className="link">
              <img
                src={
                  users?.profile
                    ? ` http://localhost:8000/${users.profile}`
                    : defaultProfile
                }
                alt="Profile"
                className="profile-pic"
              />
            </Link>
            <span
              style={{ marginTop: "10px" }}
              onClick={() =>
                navigate("/mediagallery", { state: { chatroomId: receiverid } })
              }
            >
              {user ? user : users.email}
            </span>

            <span>
              {onlineUsers.includes(receiverid) && (
                <span className="dot online" title="Online"></span>
              )}
            </span>
          </div>
          <div
            style={{ marginTop: "10px" }}
            onClick={() => {
              navigate("/searchmessage", {
                state: { chatroomId: receiverid },
              });
            }}
          >
            <BiSearch />
          </div>
        </div>
        {messages
          .filter((msgs) => !msgs.deletedFor?.includes(userId))
          .some(
            (msg) =>
              Array.isArray(msg.pinnedBy) && msg.pinnedBy.includes(userId)
          ) && (
          <div className="pinned-bar">
            <h4>Pinned Messages</h4>
            <div className="pinned-list">
              {messages
                .filter(
                  (msg) =>
                    Array.isArray(msg.pinnedBy) && msg.pinnedBy.includes(userId)
                )
                .map((msg) => (
                  <div
                    key={msg._id}
                    className="pinned-message"
                    onClick={() => {
                      const el = document.getElementById(msg._id);
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        el.classList.add("highlight");
                        setTimeout(() => {
                          el.classList.remove("highlight");
                        }, 1500);
                      }
                    }}
                  >
                    <h4>
                      {msg.type === "text" ? (
                        msg.message.length > 40 ? (
                          <>
                            {msg?.oneTimeView ? (
                              msg.viewedBy?.includes(userId) ||
                              viewedMessages.includes(msg._id) ? (
                                <div>🔒 Message has expired</div>
                              ) : viewingMessages.includes(msg._id) ? (
                                <div>{msg.message.slice(0, 40) + "..."}</div>
                              ) : (
                                <button onClick={() => handleViewOnce(msg._id)}>
                                  📩 View Once
                                </button>
                              )
                            ) : (
                              <h4>{msg.message.slice(0, 40) + "..."}</h4>
                            )}
                          </>
                        ) : (
                          <>
                            {msg?.oneTimeView ? (
                              msg.viewedBy?.includes(userId) ||
                              viewedMessages.includes(msg._id) ? (
                                <div>🔒 Message has expired</div>
                              ) : viewingMessages.includes(msg._id) ? (
                                <div>{msg.message}</div>
                              ) : (
                                <button onClick={() => handleViewOnce(msg._id)}>
                                  📩 View Once
                                </button>
                              )
                            ) : (
                              <h4>{msg.message}</h4>
                            )}
                          </>
                        )
                      ) : (
                        `${msg.type}`
                      )}
                      {msg.media?.type === "file" && (
                        <div>{msg.media.url.split("/").pop()}</div>
                      )}
                      {msg.media?.type === "image" && <div>image</div>}
                      {msg.media?.type === "video" && <div>video</div>}
                    </h4>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="chat-messages">
          {messages
            .filter((msg) => !msg.deletedFor?.includes(userId))
            .map((msg, index) => {
              const messageDate = new Date(msg.timestamp);
              const formattedDate = messageDate.toDateString();
              const showDateSeparator = formattedDate !== lastRenderedDate;
              if (showDateSeparator) {
                lastRenderedDate = formattedDate;
              }
              return (
                <div
                  key={msg._id}
                  onClick={() => setShowPicker(null)}
                  onMouseDown={(e) => setStartX(e.clientX)}
                  onMouseMove={(e) => {
                    if (startX !== null) {
                      setSwipeDiff(e.clientX - startX);
                    }
                  }}
                  onMouseUp={() => {
                    if (swipeDiff > swipeThreshold) {
                      setReplyTo(msg);
                    }
                    setStartX(null);
                    setSwipeDiff(0);
                  }}
                >
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span>{formatMessageDate(msg.timestamp)}</span>
                    </div>
                  )}
                  <div
                    className={`${
                      msg.sender._id === userId
                        ? "sentprofile"
                        : "receiveprofile"
                    }`}
                    ref={swipedMessage === msg._id ? messageContainerRef : null}
                  >
                    {msg.sender._id !== userId && (
                      <Link to={`/${msg.sender._id}/account`} className="link">
                        <img
                          src={
                            msg.sender?.profile
                              ? ` http://localhost:8000/${msg.sender?.profile}`
                              : defaultProfile
                          }
                          alt="Profile"
                          className="profile-pic"
                        />
                      </Link>
                    )}

                    <div
                      className={`message ${
                        msg.sender._id === userId ? "sent" : "received"
                      } ${
                        swipedMessage === msg._id && msg.sender._id === userId
                          ? "swiped"
                          : ""
                      }`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setShowPicker(msg._id);
                      }}
                      onMouseDown={() => {
                        const timeout = setTimeout(() => {
                          setSwipedMessage(msg._id);
                        }, 600);
                        setLongPressTimeout(timeout);
                      }}
                      onMouseUp={() => {
                        clearTimeout(longPressTimeout);
                      }}
                      onMouseLeave={() => {
                        clearTimeout(longPressTimeout);
                      }}
                    >
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setShowPicker(msg._id);
                        }}
                      >
                        {msg.forwardedFrom && (
                          <h5
                            style={{
                              margin: "0px",
                              padding: "0px",
                              fontStyle: "italic",
                            }}
                          >
                            Forwarded Message
                          </h5>
                        )}

                        <div
                          key={msg._id}
                          id={msg._id}
                          ref={(el) => (messageRefs.current[msg._id] = el)}
                          className={`message ${
                            highlightedId === msg._id ? "highlighted" : ""
                          }`}
                        >
                          {msg.replyTo && (
                            <div
                              className="reply-preview"
                              onClick={() => scrollToMessage(msg.replyTo._id)}
                            >
                              {msg.replyTo.media && (
                                <>
                                  {msg.replyTo.media &&
                                    msg.replyTo.media.type === "image" && (
                                      <img
                                        src={`http://localhost:8000/${msg.replyTo.media.url}`}
                                        alt="Sent media"
                                        className="chat-media"
                                        onClick={() =>
                                          handleImageClick(
                                            msg.replyTo.media.url
                                          )
                                        }
                                      />
                                    )}
                                  {msg.replyTo.media &&
                                    msg.replyTo.media.type === "video" && (
                                      <video controls className="chat-media">
                                        <source
                                          src={`http://localhost:8000/${msg.replyTo.media.url}`}
                                          type="video/mp4"
                                        />
                                        Your browser does not support the video
                                        tag.
                                      </video>
                                    )}
                                </>
                              )}
                              {msg.replyTo?.oneTimeView ? (
                                msg.replyTo?.viewedBy?.includes(userId) ||
                                viewedMessages.includes(msg.replyTo?._id) ? (
                                  <div>🔒 Message has expired</div>
                                ) : viewingMessages.includes(
                                    msg.replyTo?._id
                                  ) ? (
                                  <div>{msg.replyTo?.message}</div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleViewOnce(msg.replyTo?._id)
                                    }
                                  >
                                    📩 View Once
                                  </button>
                                )
                              ) : (
                                <h4>{msg.replyTo?.message}</h4>
                              )}
                              {msg.replyTo &&
                                msg.replyTo.type === "location" && (
                                  <div>location</div>
                                )}
                            </div>
                          )}
                          <div className="message-header">
                            <h4 style={{ marginRight: "10px", margin: "0px" }}>
                              {msg?.oneTimeView ? (
                                msg.viewedBy?.includes(userId) ||
                                viewedMessages.includes(msg._id) ? (
                                  <div>🔒 Message has expired</div>
                                ) : viewingMessages.includes(msg._id) ? (
                                  <div>{msg?.message}</div>
                                ) : (
                                  <button
                                    onClick={() => handleViewOnce(msg._id)}
                                  >
                                    📩 View Once
                                  </button>
                                )
                              ) : (
                                <h4> {msg?.message}</h4>
                              )}

                              {/* {msg.message && (
                                <h4>{renderMessageWithLinks(msg.message)}</h4>
                              )} */}
                              {msg.edited && (
                                <h6
                                  className="edited-label"
                                  style={{ margin: "0px" }}
                                >
                                  (edited{"  "}
                                  {new Date(msg.updatedAt).toLocaleTimeString()}
                                  )
                                </h6>
                              )}
                            </h4>
                          </div>

                          {msg.media && msg.media.type === "image" && (
                            <img
                              src={`http://localhost:8000/${msg.media.url}`}
                              alt="Sent media"
                              onClick={() => handleImageClick(msg?.media?.url)}
                              className="modal-images"
                            />
                          )}
                          {msg.media && msg.media.type === "video" && (
                            <video controls className="modal-images">
                              <source
                                src={`http://localhost:8000/${msg.media.url}`}
                                type="video/mp4"
                                onClick={() => handleImageClick(msg.media.url)}
                              />
                              Your browser does not support the video tag.
                            </video>
                          )}

                          {msg.type === "voice" && (
                            <div>
                              <audio
                                controls
                                src={`http://localhost:8000${
                                  msg.voice?.url?.startsWith("/") ? "" : "/"
                                }${msg.voice?.url}`}
                                style={{ width: "180px" }}
                              >
                                Your browser does not support the audio tag.
                              </audio>
                            </div>
                          )}

                          {msg.media && msg.media.type === "file" && (
                            <a
                              href={`http://localhost:8000/${msg.media.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-attachment"
                            >
                              📄 {msg.media.url.split("/").pop()}
                            </a>
                          )}

                          {msg?.type === "shared_profile" &&
                            msg?.sharedProfile && (
                              <div
                                style={{ zIndex: 1000 }}
                                onClick={() => {
                                  navigate(
                                    `/${msg.sharedProfile?._id}/account`
                                  );
                                }}
                              >
                                <div className="shared-post-message">
                                  <div className="post-preview">
                                    <div className="posted-by">
                                      <img
                                        src={`http://localhost:8000/${msg.sharedProfile.profile}`}
                                        alt="Profile"
                                        className="profile-pic"
                                      />
                                      <span>{msg.sharedProfile.name}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          {msg.type === "location" && msg.location ? (
                            <div className="location-message">
                              <p>{msg.location.name || "Shared Location"}</p>

                              <div
                                style={{
                                  height: "200px",
                                  width: "100%",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                }}
                              >
                                <MapContainer
                                  center={[
                                    msg.location.coordinates[1],
                                    msg.location.coordinates[0],
                                  ]}
                                  zoom={15}
                                  style={{ height: "100%", width: "100%" }}
                                  scrollWheelZoom={false}
                                >
                                  <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                  />
                                  <Marker
                                    position={[
                                      msg.location.coordinates[1],
                                      msg.location.coordinates[0],
                                    ]}
                                  >
                                    <Popup>
                                      {msg.location.name || "Shared Location"}
                                    </Popup>
                                  </Marker>
                                </MapContainer>
                              </div>

                              <a
                                href={msg.location.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-block",
                                  marginTop: "8px",
                                  color: "#007bff",
                                  textDecoration: "underline",
                                  fontWeight: "500",
                                }}
                              >
                                Open in Google Maps
                              </a>
                            </div>
                          ) : null}

                          {msg?.type === "shared_post" && msg?.sharedPost && (
                            <div
                              style={{ zIndex: 1000 }}
                              onClick={() => {
                                navigate(`/${msg.sharedPost?._id}/detail`);
                              }}
                            >
                              <div className="shared-post-message">
                                <div className="post-preview">
                                  <div className="posted-by">
                                    <img
                                      src={`http://localhost:8000/${msg.sharedPost.user.profile}`}
                                      alt="Profile"
                                      className="profile-pic"
                                    />
                                    <span>{msg.sharedPost.user.name}</span>
                                  </div>

                                  <img
                                    src={`http://localhost:8000/${msg.sharedPost.image}`}
                                    alt="Shared Post"
                                    className="shared-post-image"
                                  />

                                  <h6>{msg.sharedPost.title}</h6>
                                </div>
                              </div>
                            </div>
                          )}

                          <h6 style={{ margin: "0px" }}>
                            {!msg.edited &&
                              new Date(msg.timestamp).toLocaleTimeString()}
                          </h6>
                          {msg.sender._id === userId && (
                            <span className="status-icon">
                              {msg.status === "seen" ? "✔✔" : "✔"}
                            </span>
                          )}
                        </div>

                        {msg.reactions?.length > 0 && (
                          <div className="reaction-bar">
                            {msg.reactions.map((r, i) => (
                              <span
                                key={i}
                                className="reaction-emoji"
                                onClick={() => {
                                  const filteredUsers = msg.reactions.filter(
                                    (react) => react.emoji === r.emoji
                                  );

                                  setSelectedReactionInfo({
                                    emoji: r.emoji,
                                    users: filteredUsers,
                                    msgId: msg._id,
                                  });
                                }}
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        {showPicker === msg._id && (
                          <div
                            className="emoji-picker-popup"
                            style={{
                              position: "absolute",
                              right:
                                msg.sender._id === userId ? "10px" : "auto",
                              left: msg.sender._id !== userId ? "10px" : "auto",
                              zIndex: 1000,
                            }}
                          >
                            <EmojiPicker
                              onEmojiSelect={(emoji) => {
                                reactToMessage(msg._id, emoji.native);
                              }}
                              theme="light"
                              style={{ zIndex: 10001 }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="action-icons-container">
                        {swipedMessage === msg._id &&
                          msg?.oneTimeView !== true && (
                            <div className="action-item">
                              <div
                                title="forward message"
                                className="icon"
                                onClick={() =>
                                  navigate("/sharepost", {
                                    state: { message: msg._id },
                                  })
                                }
                              >
                                <FiSend />
                              </div>
                              <h4 className="action-label">Forward</h4>
                            </div>
                          )}
                        {swipedMessage === msg._id && (
                          <div
                            className="action-item"
                            onClick={() =>
                              handlePinToggle(
                                msg._id,
                                msg.pinnedBy?.includes(userId)
                              )
                            }
                          >
                            <div title="Pinned Message" className="icon">
                              <BiPin />
                            </div>
                            <h4 className="action-label">
                              {msg.pinnedBy?.includes(userId) ? "Unpin" : "Pin"}
                            </h4>
                          </div>
                        )}

                        {swipedMessage === msg._id && (
                          <div className="action-item">
                            <div
                              title="Delete for me"
                              className="icon"
                              onClick={() => deleteForMe(msg._id)}
                            >
                              🗑
                            </div>
                            <h4 className="action-label">Delete</h4>
                          </div>
                        )}

                        {swipedMessage === msg._id &&
                          msg.sender._id === userId && (
                            <div className="action-item">
                              <div
                                className="icon"
                                title="unsend message"
                                onClick={() => deleteMessage(msg._id)}
                                style={
                                  msg?.type === "shared_post" && msg?.sharedPost
                                    ? { top: "48%" }
                                    : {}
                                }
                              >
                                <FaReply />
                              </div>
                              <h4 className="action-label">Unsend</h4>
                            </div>
                          )}

                        {swipedMessage === msg._id &&
                          msg.sender._id === userId &&
                          msg.message !== "" &&
                          msg?.type !== "shared_post" &&
                          msg?.type !== "shared_profile" &&
                          msg?.type !== "location" &&
                          msg?.oneTimeView !== true &&
                          msg?.type !== "voice" && (
                            <div className="action-item">
                              <div
                                className="icon"
                                title="Edit message"
                                onClick={() => {
                                  setEditMode(true);
                                  setEditMessageId(msg._id);
                                  setMessage(msg.message);
                                }}
                              >
                                <FaEdit />
                              </div>
                              <h4 className="action-label">Edit</h4>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {replyTo && (
          <div className="reply-preview">
            <div className="reply-content">
              <div className="reply-to-user">
                {" "}
                {replyTo?.oneTimeView ? (
                  replyTo.viewedBy?.includes(userId) ||
                  viewedMessages.includes(replyTo._id) ? (
                    <div>🔒 Message has expired</div>
                  ) : viewingMessages.includes(replyTo._id) ? (
                    <div>{replyTo.message}</div>
                  ) : (
                    <button onClick={() => handleViewOnce(replyTo._id)}>
                      📩 View Once
                    </button>
                  )
                ) : (
                  <h4>{replyTo.message}</h4>
                )}
              </div>
              {replyTo?.media?.type === "image" && (
                <img
                  src={`http://localhost:8000/${replyTo.media?.url}`}
                  alt="Full size"
                />
              )}
              {replyTo?.media?.type === "video" && (
                <video
                  src={`http://localhost:8000/${replyTo.media?.url}`}
                  alt="Full size"
                  className="chat-media-preview"
                />
              )}
              {replyTo?.type === "voice" && (
                <audio
                  controls
                  src={`http://localhost:8000${
                    replyTo.voice?.url?.startsWith("/") ? "" : "/"
                  }${replyTo.voice?.url}`}
                  style={{ width: "180px" }}
                >
                  Your browser does not support the audio tag.
                </audio>
              )}
              {replyTo?.type === "location" && (
                <div className="reply-to-user">location</div>
              )}
              {replyTo.media && replyTo.media.type === "file" && (
                <a
                  href={`http://localhost:8000/${replyTo.media.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-attachment"
                >
                  📄 {replyTo.media.url.split("/").pop()}
                </a>
              )}
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="cancel-reply"
              title="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}

        {selectedImage && (
          <div className="modal" onClick={closeModal}>
            <div
              className="modal-content"
              style={{ maxWidth: "500px", maxHeight: "500px" }}
            >
              <span onClick={closeModal} style={{ cursor: "pointer" }}>
                &times;
              </span>
              <img
                src={`http://localhost:8000/${selectedImage}`}
                alt="Full size"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}

        {selectedReactionInfo?.users?.length > 0 && (
          <div className="reaction-popup">
            <div className="reaction-popup-content">
              <h4>Reacted with {selectedReactionInfo.emoji}</h4>
              {selectedReactionInfo.users.map((r, index) => (
                <div key={index} className="abc">
                  <img
                    src={
                      r.user?.profile
                        ? `http://localhost:8000/${r.user?.profile}`
                        : defaultProfile
                    }
                    alt="Profile"
                    className="small-profile-pic"
                  />
                  <span>{r.user?.name || "Unknown"}</span>
                  {r.user._id === userId && (
                    <button
                      onClick={() => {
                        removeReaction(selectedReactionInfo.msgId);
                        setSelectedReactionInfo({
                          emoji: null,
                          users: [],
                          messageId: null,
                        });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={() =>
                  setSelectedReactionInfo({
                    emoji: null,
                    users: [],
                    messageId: null,
                  })
                }
              >
                Close
              </button>
            </div>
          </div>
        )}
        {receiverTyping && (
          <div className="typing-indicator">
            <span>typing...</span>
          </div>
        )}

        {selectedMedia && (
          <div className="media-preview">
            {selectedMedia.type === "file" ? (
              <a
                href={`http://localhost:8000/${selectedMedia.previewURL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="file-attachment"
              >
                📄 {selectedMedia.previewURL.split("/").pop()}
              </a>
            ) : (
              <>
                {selectedMedia.type === "image" ? (
                  <img
                    src={selectedMedia.previewURL}
                    alt="preview"
                    className="chat-media-preview"
                  />
                ) : (
                  <video
                    src={selectedMedia.previewURL}
                    controls
                    className="chat-media-preview"
                  />
                )}
              </>
            )}
            <button
              onClick={() => setSelectedMedia(null)}
              className="remove-media-btn"
            >
              ❌
            </button>
          </div>
        )}

        {BlockUser.includes(receiverid) || right ? (
          <>
            {right ? (
              <h4 style={{ textAlign: "center" }}>
                You are Block by This User
              </h4>
            ) : (
              <>
                <h4>Do you Want to Unblock this User ?</h4>
                <button
                  style={{ color: "red", background: "white" }}
                  onClick={() => Block(receiverid)}
                >
                  Unblock
                </button>
              </>
            )}
          </>
        ) : (
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                socket.emit("typing", {
                  chatroom: [userId, receiverid].sort().join("_"),
                  sender: userId,
                  receiver: receiverid,
                });
              }}
              placeholder="Type a message..."
            />

            <DatePicker
              selected={scheduledTime}
              onChange={(date) => setScheduledTime(date)}
              showTimeInput
              placeholderText="🗓️"
              dateFormat="Pp"
            />

            <label className="toggle-container">
              <input
                type="checkbox"
                checked={isOneTime}
                onChange={(e) => setIsOneTime(e.target.checked)}
              />
              <span className="toggle-switch" title="one time message"></span>
            </label>

            <FaLocationDot
              onClick={() => setShowDropdown((prev) => !prev)}
              size={23}
              style={{
                cursor: "pointer",
                marginTop: "18px",
                marginLeft: "10px",
              }}
              title="send location"
            />

            {showDropdown && (
              <div className="modal" style={{ zIndex: 10001 }}>
                <span className="close" onClick={() => setShowDropdown(false)}>
                  &times;
                </span>
                <div
                  className="follow-contents"
                  style={{ width: "300px", color: "black" }}
                >
                  <div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        sendLocationMessage();
                      }}
                    >
                      📍 Send Current Location
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/location", {
                          state: {
                            chatroom: chatroomId,
                            sender: userId,
                            type: "location",
                          },
                        });
                      }}
                    >
                      🔍 Search Location
                    </div>
                  </div>
                </div>
              </div>
            )}
            <VoiceRecorder
              senderId={userId}
              receiverId={receiverid}
              option="direct"
            />
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              style={{ display: "none" }}
              ref={(ref) => (fileInputRef.current = ref)}
            />
            <MdAttachFile
              size={35}
              style={{
                cursor: "pointer",
                marginTop: "13px",
                marginLeft: "10px",
              }}
              onClick={() => fileInputRef.current.click()}
              title=" Attach File"
            />
            <button onClick={sendMessage}> Send </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DirectChat;
