import { useEffect, useState } from "react";
import axios from "axios";
import defaultProfile from "../profile.png";
import { Link, useLocation } from "react-router-dom";
import Header from "../header";

const MediaGallery = () => {
  const [mediaMessages, setMediaMessages] = useState([]);
  const location = useLocation();
  const [filter, setFilter] = useState("media");
  const chatroomId = location.state?.chatroomId;
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (!chatroomId) return;
    axios
      .get(`http://localhost:8000/messages/media/${chatroomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setMediaMessages(res.data))
      .catch((err) => console.error("Failed to fetch media:", err));
  }, [chatroomId]);

  const filtered = mediaMessages.filter((msg) => {
    // if (filter === "all") return true;
    if (filter === "media") return msg.media?.type === "image";
    if (filter === "video") return msg.media?.type === "video";
    if (filter === "files") return msg.media?.type === "file";
    if (filter === "links") return msg.message?.match(/https?:\/\/[^\s]+/);
    if (filter === "posts") return msg.type === "shared_post";
    return false;
  });

  return (
    <>
      <Header />
      <div className="chat-container">
        <div className="chat-headers">
          {["media", "video", "files", "links", "posts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={filter === tab ? "active" : ""}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="chat-messagess">
          {filtered.map((msg) => (
            <div key={msg._id}>
              {msg.media?.type === "image" && (
                <img
                  src={
                    msg.media.url
                      ? ` http://localhost:8000/${msg.media.url}`
                      : defaultProfile
                  }
                  alt="Profile"
                  className="post-cards"
                />
              )}
              {msg.media?.type === "video" && (
                <video
                  src={
                    msg.media.url
                      ? ` http://localhost:8000/${msg.media.url}`
                      : defaultProfile
                  }
                  alt="Profile"
                  className="post-cards"
                  controls
                />
              )}
              {msg.media?.type === "file" && (
                <a
                  href={`http://localhost:8000/${msg.media.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-attachments"
                >
                  📄 {msg.media.url.split("/").pop()}
                </a>
              )}

              {msg.message?.match(/https?:\/\/[^\s]+/) && (
                <>
                  <a href={msg.message} target="blank">
                    🔗 {msg.message}
                  </a>
                  <br></br>
                  <br></br>
                </>
              )}

              {msg.type === "shared_post" && msg.sharedPost && (
                <Link to={`/${msg.sharedPost._id}/detail`} className="link">
                  <div className="shared-post-card">
                    <img
                      src={
                        msg.sharedPost.image
                          ? ` http://localhost:8000/${msg.sharedPost.image}`
                          : defaultProfile
                      }
                      alt="Post"
                      className="shared-post-img"
                    />
                    <h4>{msg.sharedPost.title}</h4>
                    <small>by {msg.sharedPost.user?.name}</small>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MediaGallery;
