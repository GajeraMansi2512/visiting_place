import axios from "axios";
import React, { useEffect, useState } from "react";
import profile from "../profile.png";
import { Link } from "react-router-dom";
import Header from "../header";

function ArchiveChat() {
  const [archiveUser, setArchivedUsers] = useState([]);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const res = await axios.get("http://localhost:8000/messages/archived", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArchivedUsers(res.data);
      } catch (err) {
        console.error("Fetch error", err);
      }
    };
    fetchArchived();
  }, []);

  const handleUnarchive = async (otherUserId) => {
    try {
      await axios.post(
        `http://localhost:8000/messages/unarchive`,
        { otherUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArchivedUsers((prev) => prev.filter((u) => u._id !== otherUserId));
    } catch (err) {
      console.error("Unarchive failed", err);
    }
  };

  return (
    <div>
      <Header />
      <div className="message-list">
        {archiveUser?.map((user) => (
          <div
            key={user._id}
            className="user-entry"
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Link
              to={`/${user.name ? user.name : user.email}/${user._id}`}
              className="link"
            >
              <div className="user-link">
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
              </div>
            </Link>

            <button
              onClick={() => handleUnarchive(user._id)}
              className="button"
            >
              Unarchive
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchiveChat;
