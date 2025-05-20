import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import profile from "../profile.png";
import { Link } from "react-router-dom";
import Header from "../header";
import io from "socket.io-client";
import "../css/chat.css";

const socket = io("http://localhost:8000");

function MessageList() {
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const timeoutRef = useRef(null);
  const [search, setSearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTo, setBroadcastTo] = useState("all");
  const [singleTarget, setSingleTarget] = useState(null);

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    let recipients = [];

    if (broadcastTo === "all") {
      recipients = users.map((u) => u._id);
    } else if (broadcastTo === "one" && singleTarget) {
      recipients = [singleTarget._id];
    }

    socket.emit("sendBroadcast", {
      sender: userId,
      message: `${broadcastMessage}`,
      type: "text",
      recipients,
    });

    setShowBroadcast(false);
    setBroadcastMessage("");
    setSingleTarget(null);
  };

  const togglePin = async (userIdToPin, isPinned) => {
    try {
      const pinnedUsers = users.filter((u) => u.pinned);

      if (!isPinned && pinnedUsers.length >= 3) {
        alert("You can only pin up to 3 users.");
        return;
      }

      const url = `http://localhost:8000/messages/${
        isPinned ? "unpin" : "pin"
      }/${userIdToPin}`;
      await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedUser(null);
      setUsers((prevUsers) => {
        const now = new Date().toISOString();
        const updated = prevUsers.map((u) => {
          if (u._id === userIdToPin) {
            return {
              ...u,
              pinned: !isPinned,
              pinnedAt: !isPinned ? now : null,
            };
          }
          return u;
        });

        return [...updated].sort((a, b) => {
          if (a.pinned && b.pinned) {
            return new Date(b.pinnedAt) - new Date(a.pinnedAt);
          }
          if (a.pinned) return -1;
          if (b.pinned) return 1;
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });
      });
    } catch (err) {
      console.error("Pin/unpin failed", err);
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:8000/messages/unread-counts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUnreadCounts(res.data))
      .catch((err) => console.error("Failed to fetch unread counts:", err));
  }, [unreadCounts]);

  useEffect(() => {
    socket.emit("user-online", userId);
    socket.on("online-users", (users) => setOnlineUsers(users));
    return () => socket.off("online-users");
  }, [userId]);

  const handleMouseDown = (user) => {
    timeoutRef.current = setTimeout(() => {
      setSelectedUser(user._id);
      setShowDeletePopup(true);
    }, 700);
  };

  const handleMouseUp = () => {
    clearTimeout(timeoutRef.current);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/messages/user/${selectedUser}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser));
      setShowDeletePopup(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to delete user chat", err);
    }
  };
  useEffect(() => {
    if (isSearching) {
      fetch(`http://localhost:8000/user?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUsers(data);
          setLoading(false);
        });
    } else {
      axios
        .get("http://localhost:8000/messages", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUsers(res.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
          setLoading(false);
        });
    }
  }, [search, isSearching, token]);

  return (
    <div>
      <Header />
      <input
        type="text"
        name="search"
        style={{ width: "400px" }}
        placeholder="Search User"
        className="usersearch"
        onChange={(e) => {
          const value = e.target.value;
          setSearch(value);
          setIsSearching(value.trim().length > 0);
        }}
      />
      <br></br>
      <button
        onClick={() => {
          setBroadcastTo("all");
          setShowBroadcast(true);
        }}
        className="bm"
      >
        Broadcast Message
      </button>
      <Link to="/archiveuser">
        {" "}
        <button>Archive Message</button>
      </Link>

      {showBroadcast && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>
              {broadcastTo === "one"
                ? `Send Message to ${singleTarget?.name || singleTarget?.email}`
                : "Broadcast Message"}
            </h3>
            <textarea
              placeholder="Enter your message"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
            />
            <div className="popup-buttons">
              <button onClick={sendBroadcast}>Send</button>
              <button
                onClick={() => {
                  setShowBroadcast(false);
                  setBroadcastMessage("");
                  setSingleTarget(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="message-list">
        {users.length > 0 ? (
          users.map((user) => {
            const userLink = `/${user.name ? user.name : user.email}/${
              user._id
            }`;
            const isSelected = selectedUser === user._id;

            return (
              <Link to={userLink} key={user._id} className="link">
                <div
                  className="user-entry"
                  onMouseDown={() => handleMouseDown(user)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="user-link"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <img
                      src={
                        user.profile
                          ? `http://localhost:8000/${user.profile}`
                          : profile
                      }
                      alt="Profile"
                      className="profile-pic"
                    />
                    <span>{user.name ? user.name : user.email}</span>
                    {user.pinned && <span>📌</span>}
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="dot online"
                        title="Online"
                        style={{ marginBottom: "10px", marginRight: "10px" }}
                      ></span>
                    )}

                    {unreadCounts[user._id] > 0 && (
                      <span className="unread-count">
                        {unreadCounts[user._id]}
                      </span>
                    )}
                  </div>

                  <div
                    style={{ position: "relative" }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedUser((prev) =>
                        prev === user._id ? null : user._id
                      );
                    }}
                  >
                    <span className="three-dots">&#8942;</span>
                    {isSelected && (
                      <div className="dropdown-menu">
                        <div
                          className="dropdown-item"
                          onClick={(e) => {
                            e.preventDefault();
                            togglePin(user._id, user.pinned);
                            // setSelectedUser(null);
                          }}
                        >
                          {user.pinned ? "Unpin" : "Pin"}
                        </div>
                        <div
                          className="dropdown-item"
                          onClick={async (e) => {
                            e.preventDefault();
                            const chatroomId =
                              userId < user._id
                                ? `${userId}_${user._id}`
                                : `${user._id}_${userId}`;
                            try {
                              await axios.post(
                                `http://localhost:8000/messages/archive/${chatroomId}`,
                                {},
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              setUsers((prev) =>
                                prev.filter((u) => u._id !== user._id)
                              );
                              setSelectedUser(null);
                            } catch (err) {
                              console.error("Archiving failed", err);
                            }
                          }}
                        >
                          Archive
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <h3 className="h2">No User</h3>
        )}
      </div>

      {showDeletePopup && selectedUser && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>Are you sure you want to delete this conversation?</p>
            <div className="popup-buttons">
              <button onClick={handleDelete} className="confirm">
                Yes
              </button>
              <button
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedUser(null);
                }}
                className="cancel"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;
