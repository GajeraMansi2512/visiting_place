import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "../css/chat.css";
import profile from "../profile.png";
import { Link, useNavigate } from "react-router-dom";
import Header from "../header";
import EmojiPicker from "@emoji-mart/react";
import { FiSend } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import { FaLocationDot, FaReply } from "react-icons/fa6";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import VoiceRecorder from "./voiceRecorder";
import { MdAttachFile, MdOutlinePoll } from "react-icons/md";
import { BiPin } from "react-icons/bi";

const socket = io("http://localhost:8000");

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [swipedMessage, setSwipedMessage] = useState(null);
  const messageContainerRef = useRef(null);
  const userId = sessionStorage.getItem("userId");
  const [room, setRoom] = useState("general");
  const [showPicker, setShowPicker] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [selectedReactionInfo, setSelectedReactionInfo] = useState(null);
  const [longPressTimeout, setLongPressTimeout] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [swipeDiff, setSwipeDiff] = useState(0);
  const swipeThreshold = 100;
  const messageRefs = useRef({});
  const [highlightedId, setHighlightedId] = useState(null);
  const [startX, setStartX] = useState(0);
  const navigate = useNavigate();
  const hasLoadedRef = useRef(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePolls, setActivePolls] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [viewingMessages, setViewingMessages] = useState([]);
  const [viewedMessages, setViewedMessages] = useState([]);
  const [isOneTime, setIsOneTime] = useState(false);

  useEffect(() => {
    socket.on("newPoll", (poll) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          _id: poll._id,
          sender: userId,
          message: poll.question,
          type: "poll",
          options: poll.options,
          votes: Array(poll.options.length).fill([]),
        },
      ]);
      setActivePolls((prevPolls) => ({
        ...prevPolls,
        [poll._id]: {
          options: poll.options,
          votes: Array(poll.options.length).fill([]),
          votedUsers: poll.votedUsers || {},
        },
      }));
      if (poll.votedUsers?.[userId] !== undefined) {
        setSelectedOptions((prevSelected) => ({
          ...prevSelected,
          [poll._id]: poll.votedUsers[userId],
        }));
      }
    });

    socket.on("pollUpdated", (updatedPoll) => {
      setActivePolls((prevPolls) => {
        const existingPoll = prevPolls[updatedPoll._id] || {};
        return {
          ...prevPolls,
          [updatedPoll._id]: {
            ...existingPoll,
            options: updatedPoll.options,
            votedUsers: updatedPoll.votedUsers || {},
          },
        };
      });

      if (
        updatedPoll.votedUsers &&
        updatedPoll.votedUsers[userId] !== undefined
      ) {
        setSelectedOptions((prevSelected) => ({
          ...prevSelected,
          [updatedPoll._id]: updatedPoll.votedUsers[userId],
        }));
      }
    });

    return () => {
      socket.off("newPoll");
      socket.off("pollUpdated");
    };
  }, []);

  const handleVote = (pollId, optionIndex) => {
    const sender = userId;
    localStorage.setItem(`poll-${pollId}`, optionIndex);

    setSelectedOptions((prevSelected) => ({
      ...prevSelected,
      [pollId]: optionIndex,
    }));

    setActivePolls((prevPolls) => {
      const poll = prevPolls[pollId];
      if (!poll) return prevPolls;

      const updatedPoll = { ...poll };

      updatedPoll.options = updatedPoll.options.map((option, idx) => {
        const newVotes = [...option.votes];

        if (idx === optionIndex) {
          if (!newVotes.includes(sender)) {
            newVotes.push(sender);
          }
        } else {
          const filteredVotes = newVotes.filter(
            (voterId) => voterId !== sender
          );
          newVotes.length = 0;
          newVotes.push(...filteredVotes);
        }

        return {
          ...option,
          votes: newVotes,
        };
      });

      return {
        ...prevPolls,
        [pollId]: updatedPoll,
      };
    });
    socket.emit("votePoll", { pollId, optionIndex, sender });
  };
  useEffect(() => {
    Object.keys(activePolls).forEach((pollId) => {
      const storedOption = localStorage.getItem(`poll-${pollId}`);
      if (storedOption !== null) {
        setSelectedOptions((prev) => ({
          ...prev,
          [pollId]: parseInt(storedOption),
        }));
      }
    });
  }, [activePolls]);

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(messageId);

      setTimeout(() => setHighlightedId(null), 2000);
    }
  };
  useEffect(() => {
    if (hasLoadedRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      hasLoadedRef.current = false;
    }
  }, [messages]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    socket.emit("joinRoom", { chatroom: room });
    axios.get(`http://localhost:8000/messages/${room}`).then((res) => {
      setMessages(res.data);
      hasLoadedRef.current = true;
    });

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) =>
            msg._id === newMessage._id ||
            (msg.tempId && msg.tempId === newMessage.tempId)
        );
        if (alreadyExists) return prev;

        return [
          ...prev,
          { ...newMessage, viewedBy: newMessage.viewedBy || [] },
        ];
      });
      hasLoadedRef.current = true;
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
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
    socket.on("editError", ({ messageId, error }) => {
      alert(error);
    });

    socket.on("typing", ({ sender }) => {
      if (sender !== userId && !typingUsers.includes(sender)) {
        setTypingUsers((prev) => [...prev, sender]);
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== sender));
        }, 3000);
      }
    });

    socket.on("messageDeleted", (deletedMessageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== deletedMessageId));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDeleted");
      socket.off("messageReaction");
      socket.off("typing");
      socket.off("messageViewedOnce");
      socket.off("editError");
    };
  }, [room]);

  const reactToMessage = (messageId, emoji) => {
    const message = messages.find((msg) => msg._id === messageId);
    const existingReaction = message?.reactions?.find(
      (r) => r.user === userId && r.emoji === emoji
    );

    if (existingReaction) {
      socket.emit("removeReaction", {
        messageId,
        userId,
        chatroom: room,
      });
    } else {
      socket.emit("reactMessage", {
        messageId,
        userId,
        emoji,
        chatroom: room,
      });
    }
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
    if (!message.trim() && !selectedMedia) return;

    const senderName = sessionStorage.getItem("username");

    let mediaData = null;

    if (selectedMedia) {
      const formData = new FormData();
      formData.append("media", selectedMedia.file);

      try {
        const res = await axios.post(
          "http://localhost:8000/messages/upload",
          formData
        );
        mediaData = { url: res.data.url, type: selectedMedia.type };
      } catch (err) {
        console.error("Upload failed:", err);
        return;
      }
    }
    if (editMode) {
      socket.emit("editMessage", {
        messageId: editMessageId,
        newContent: message,
        chatroom: room,
        senderSocketId: socket.id,
      });

      setEditMode(false);
      setEditMessageId(null);
      setMessage("");
      return;
    }
    socket.emit("sendMessage", {
      chatroom: room,
      sender: userId,
      senderName,
      message,
      replyTo,
      media: mediaData,
      oneTimeView: isOneTime,
    });

    setMessage("");
    setSelectedMedia(null);
    setReplyTo(null);
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
      console.error("Failed to delete message for me:", error);
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      await axios.delete(`http://localhost:8000/messages/${msgId}/${room}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
      setSwipedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

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
          name: "My Location",
          mapUrl: `https://maps.google.com?q=${latitude},${longitude}`,
        };

        socket.emit("sendMessage", {
          chatroom: room,
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

  const removeReaction = (messageId) => {
    socket.emit("removeReaction", {
      messageId,
      userId,
    });
  };
  let lastRenderedDate = null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let type = "file";
    if (file.type.startsWith("image")) type = "image";
    else if (file.type.startsWith("video")) type = "video";

    const previewURL = URL.createObjectURL(file);
    setSelectedMedia({ file, previewURL, type });
  };
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

  return (
    <>
      <Header />
      <div className="chat-container">
        <div
          className="chat-header"
          style={{
            justifyContent: "space-between",
          }}
        >
          <span
            onClick={() =>
              navigate("/mediagallery", { state: { chatroomId: room } })
            }
          >
            Group: {room}
          </span>
          <select onChange={(e) => setRoom(e.target.value)}>
            <option value="general">General</option>
            <option value="travel">Travel</option>
            <option value="adventure">Adventure</option>
          </select>
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
                    key={msg._id}
                    className={`${
                      msg.sender._id === userId
                        ? "sentprofile"
                        : "receiveprofile"
                    }`}
                    ref={swipedMessage === msg._id ? messageContainerRef : null}
                  >
                    {msg.sender._id !== userId && (
                      <Link to={`/${msg.sender._id}/account`}>
                        <img
                          src={
                            msg.sender?.profile
                              ? `http://localhost:8000/${msg.sender?.profile}`
                              : profile
                          }
                          alt="Profile"
                          className="profile-pic"
                        />
                      </Link>
                    )}
                    <div>
                      {msg.sender._id !== userId && (
                        <h6 style={{ margin: "3px", color: "lightblack" }}>
                          {msg.sender.name ? msg.sender.name : "Unknown"}
                        </h6>
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
                          }, 700);
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
                          key={msg._id}
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
                              {msg.replyTo.message}
                            </div>
                          )}
                          <div className="message-header">
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
                            {/* <h4> {msg.message && <h4>{msg.message}</h4>}</h4> */}
                            {msg.edited && (
                              <h6
                                className="edited-label"
                                style={{ margin: "0px" }}
                              >
                                (edited{"  "}
                                {new Date(msg.updatedAt).toLocaleTimeString()})
                              </h6>
                            )}
                          </div>

                          {(activePolls[msg._id]?.options || msg.poll?.options)
                            ?.length > 0 &&
                            (
                              activePolls[msg._id]?.options || msg.poll?.options
                            ).map((option, index) => (
                              <div key={index} className="poll-option">
                                <button
                                  onClick={() => handleVote(msg._id, index)}
                                  className={
                                    option.votes.includes(userId)
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  <span>
                                    {console.log(option.votes)}
                                    {option.optionText} ({option.votes.length}{" "}
                                  </span>
                                  votes)
                                </button>
                              </div>
                            ))}

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

                          {msg.media && msg.media.type === "image" && (
                            <img
                              src={`http://localhost:8000/${msg.media.url}`}
                              alt="Sent media"
                              className="modal-image"
                              onClick={() => handleImageClick(msg.media.url)}
                            />
                          )}
                          {msg.type === "location" && msg.location ? (
                            <div className="location-message">
                              <span>
                                {msg.location.name || "Shared Location"}
                              </span>

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
                                  style={{
                                    height: "100%",
                                    width: "100%",
                                  }}
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

                          {msg.media && msg.media.type === "file" && (
                            <a
                              href={`http://localhost:8000/${msg.media.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-attachment"
                              style={{ paddingRight: "70px" }}
                            >
                              📄 {msg.media.url.split("/").pop()}
                            </a>
                          )}
                          {msg.media && msg.media.type === "video" && (
                            <video controls className="chat-media">
                              <source
                                src={`http://localhost:8000/${msg.media.url}`}
                                type="video/mp4"
                              />
                              Your browser does not support the video tag.
                            </video>
                          )}

                          <h6 style={{ margin: "0px" }}>
                            {!msg.edited &&
                              new Date(msg.timestamp).toLocaleTimeString()}
                          </h6>
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
                                {msg.pinnedBy?.includes(userId)
                                  ? "Unpin"
                                  : "Pin"}
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
                                    msg?.type === "shared_post" &&
                                    msg?.sharedPost
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
                            msg?.oneTimeView !== true && (
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
                    {showPicker === msg._id && (
                      <div className="emoji-picker-popup">
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            reactToMessage(msg._id, emoji.native);
                            setShowPicker(null);
                          }}
                          theme="dark"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {replyTo && (
          <div className="reply-preview">
            <div className="reply-content">
              <div className="reply-to-user">{replyTo.message}</div>
            </div>
            {replyTo?.media?.type === "image" && (
              <img
                src={`http://localhost:8000/${replyTo.media?.url}`}
                alt="Full size"
                className="chat-media-preview"
              />
            )}
            {replyTo?.media?.type === "video" && (
              <video
                src={`http://localhost:8000/${replyTo.media?.url}`}
                alt="Full size"
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
                        : profile
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

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.length === 1
              ? "Someone is typing..."
              : `${typingUsers.length} people are typing...`}
          </div>
        )}

        {selectedMedia && (
          <div className="media-preview">
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
            <button
              onClick={() => setSelectedMedia(null)}
              className="remove-media-btn"
            >
              X
            </button>
          </div>
        )}

        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing", {
                chatroom: room,
                sender: userId,
              });
            }}
            placeholder="Type a message..."
          />
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={isOneTime}
              onChange={(e) => setIsOneTime(e.target.checked)}
            />
            <span className="toggle-switch" title="one time message"></span>
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            style={{ display: "none" }}
          />

          <FaLocationDot
            onClick={() => setShowDropdown((prev) => !prev)}
            size={23}
            style={{ marginTop: "13px", marginLeft: "10px", cursor: "pointer" }}
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
                          chatroom: room,
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
            receiverId={room}
            option="chatroom"
          />

          <input
            type="file"
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
            style={{ display: "none" }}
            ref={(ref) => (fileInputRef.current = ref)}
          />
          <MdAttachFile
            size={32}
            style={{
              cursor: "pointer",
              marginTop: "10px",
              marginLeft: "10px",
            }}
            onClick={() => fileInputRef.current.click()}
            title=" Attach File"
          />
          <MdOutlinePoll
            size={35}
            onClick={() => navigate("/poll", { state: { chatroomId: room } })}
            style={{
              cursor: "pointer",
              marginTop: "10px",
              marginLeft: "10px",
            }}
            title="poll"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </>
  );
};

export default ChatRoom;
