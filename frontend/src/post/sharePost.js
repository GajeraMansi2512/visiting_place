import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import profile from "../profile.png";
import Header from "../header";

function SharePost() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");
  const location = useLocation();
  const post = location.state?.post;
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const message = location.state?.message;
  const [search, setSearch] = useState([]);
  const searchParam = search ? `&search=${search}` : "";
  const profileToShare = location.state?.profileToShare;

  useEffect(() => {
    if (post?._id) {
      fetch(`http://localhost:8000/${post._id}/detail`)
        .then((res) => res.json())
        .then((data) => setPosts([data]))
        .catch((err) => console.error("Error loading post:", err));
    }

    fetch("http://localhost:8000/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data.filter((user) => user._id !== userId)))
      .catch((err) => console.error("Error fetching users:", err));
  }, [token, userId, navigate, post]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShareToMultiple = async () => {
    if (selectedUsers.length === 0) return alert("Select at least one user");

    for (const receiverId of selectedUsers) {
      const chatroom = [userId, receiverId].sort().join("_");

      let messageData;

      if (post) {
        messageData = {
          senderId: userId,
          receiverId,
          message: "Shared a post",
          type: "shared_post",
          post: {
            _id: post._id,
            title: post.title,
            description: post.description,
            image: post.image,
            user: {
              _id: post.userId._id,
              name: post.userId.name,
              profile: post.userId.profile,
            },
          },
        };
      } else if (profileToShare) {
        messageData = {
          senderId: userId,
          receiverId,
          message: "Shared a profile",
          type: "shared_profile",
          sharedProfile: profileToShare,
        };
      } else if (message) {
        try {
          const res = await fetch(
            `http://localhost:8000/messages/forward/${message}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ receiverId }),
            }
          );

          if (!res.ok) {
            const error = await res.json();
            console.error("Forward error:", error);
          }
        } catch (err) {
          console.error("Forwarding failed:", err);
        }

        continue;
      }

      if (messageData) {
        await fetch(`http://localhost:8000/messages/${chatroom}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        });
      }
    }

    navigate(-1);
  };

  useEffect(() => {
    const fetchUsers = () => {
      fetch(`http://localhost:8000/user?${searchParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUsers(data);
        });
    };
    fetchUsers();
  }, [token, searchParam]);

  return (
    <>
      <Header />
      <input
        type="text"
        name="search"
        style={{ width: "390px" }}
        placeholder="Search User"
        className="usersearch"
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="share-post-container">
        {users.length === 0 ? (
          <p className="no-users-text">No users to share with.</p>
        ) : (
          <>
            {users.map((user) => (
              <div className="share-user-card" key={user._id}>
                <div className="share-user-info">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                  />
                  <img
                    src={
                      user.profile
                        ? `http://localhost:8000/${user.profile}`
                        : profile
                    }
                    alt="img"
                  />
                  <span className="share-user-name">
                    {user.name ? user.name : user.email}
                  </span>
                </div>
              </div>
            ))}
            {selectedUsers.length > 0 && (
              <button
                className="share-send-button"
                onClick={handleShareToMultiple}
              >
                Send to {selectedUsers.length} User
                {selectedUsers.length > 1 ? "s" : ""}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default SharePost;
