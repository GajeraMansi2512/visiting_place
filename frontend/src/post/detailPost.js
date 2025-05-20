import { useEffect, useRef, useState } from "react";
import Header from "../header";
import { Link, useParams } from "react-router-dom";
import AddReview from "../review/AddReview";
import { BiDownload } from "react-icons/bi";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { FaHeart } from "react-icons/fa";
import profile from "../profile.png";
import Experience from "./Experience";

export default function DetailPost() {
  const { id } = useParams();
  const [post, setPost] = useState([]);
  const [name, setname] = useState([]);
  const token = sessionStorage.getItem("token");
  const [avgRating, setAvgRating] = useState(0);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [showAllComments, setShowAllComments] = useState(false);
  const [review, setReview] = useState([]);
  const [suggestedPost, setSuggestedPost] = useState([]);
  const [location, setLocation] = useState(null);
  const [like, setLike] = useState([]);
  const [moreImage, setMoreImage] = useState([]);
  const userId = sessionStorage.getItem("userId");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [reportedCommentId, setReportedCommentId] = useState(null);

  const handleLongPress = (commentId) => {
    setOpenDropdown(commentId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const customIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });
  const [text, setText] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/${id}/detail`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPost(data.post);
        setname(data.name);
        setReview(data.post.review);
        setMoreImage(data.post.moreImage);
        setSuggestedPost(data.suggestedPost || null);
        sessionStorage.setItem("userId", data.userId);
      });

    fetch(`http://localhost:8000/like`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.likedComments)) {
          setLike(data.likedComments);
        } else {
          setLike([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching favourites:", err);
        setLike([]);
      });
  }, [token, id]);

  const addToFavourite = (id) => {
    fetch(`http://localhost:8000/like/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setLike((prevLikes) =>
          prevLikes.includes(id)
            ? prevLikes.filter((ids) => ids !== id)
            : [...prevLikes, id]
        );
        fetchComment();
      })
      .catch((err) => {
        console.error("Error adding to favorites:", err);
      });
  };

  useEffect(() => {
    fetchComment();
  }, [id]);

  const fetchComment = () => {
    fetch(`http://localhost:8000/${id}/viewcomment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error fetching comments : ", err));
  };

  const sendComment = () => {
    if (newComment === "") {
      alert("Enter Comment");
    }
    fetch(`http://localhost:8000/${id}/comment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: newComment }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.comment) {
          setComments((prevComments) => [
            { ...data.comment, userId: data.comment.userId },
            ...prevComments,
          ]);
          setNewComment("");
          fetchComment();
        }
      })
      .catch((err) => console.error("Error posting comment:", err));
  };

  useEffect(() => {
    if (post && post.hashtags) {
      const hashtags = extractHashtags(post.hashtags);
      setText(hashtags);
    }
  }, [post]);

  const extractHashtags = (desc) => {
    if (Array.isArray(desc)) return desc;
    return desc ? desc.match(/#\w+/g) || [] : [];
  };

  useEffect(() => {
    const totalReviews = review?.length;
    const totalRating = review.reduce((sum, review) => sum + review.rating, 0);
    setAvgRating(totalRating / totalReviews);
  }, [review]);

  const sendReply = (commentId) => {
    if (replyText === "") {
      alert("Enter Reply");
    }
    fetch(`http://localhost:8000/reply/${commentId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: replyText }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reply) {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment._id === commentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), data.reply],
                  }
                : comment
            )
          );
          setReplyText("");
          setReplyTo(null);
          fetchComment();
        }
      })
      .catch((err) => console.error("Error posting reply : ", err));
  };

  const generatePdf = () => {
    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:8000/${id}/generatePdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((data) => {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `post-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  const toggleReplies = (commentId) => {
    setExpandedComments((prevState) => ({
      ...prevState,
      [commentId]: !prevState[commentId],
    }));
  };

  useEffect(() => {
    if (post.title && post.country) {
      const place = encodeURIComponent(post.title);

      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}&accept-language=en`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            setLocation({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          } else {
            console.error("Location not found");
          }
        })
        .catch((err) => console.error("Error fetching coordinates:", err));
    }
  }, [post.title, post.country]);

  const ReportComment = (id) => {
    if (!reason) {
      alert("Please enter a reason for reporting.");
      return;
    }
    fetch(`http://localhost:8000/report/comment/${reportedCommentId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setReason("");
        setOpen(false);
      })
      .catch((err) => console.error("Error adding to favourites:", err));
  };

  const renderComments = (commentsList, level = 0) => {
    return commentsList.map((comment) => (
      <div
        key={comment._id}
        className="comment"
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress(comment._id);
        }}
      >
        <Link to={`/${comment.userId._id}/account`} className="link">
          <img
            src={
              comment.userId?.profile
                ? `http://localhost:8000/${comment.userId.profile}`
                : profile
            }
            alt="profile"
            className="profile-pic"
          />
        </Link>
        <div className="comment-content">
          <Link to={`/${comment.userId._id}/account`} className="link">
            <p>{comment.userId?.name || "Unknown User"}</p>
          </Link>
          <h5>{comment.text}</h5>

          {openDropdown === comment._id && (
            <div ref={dropdownRef} className="dropdown-menu">
              {(userId === comment.userId?._id ||
                userId === post.userId?._id) && (
                <p onClick={() => deleteComment(comment._id)}>Delete</p>
              )}
              {userId !== comment.userId._id && (
                <p onClick={() => setOpen(true)}>Report</p>
              )}
            </div>
          )}

          <div className="comment-actions">
            <p
              onClick={() => setReplyTo(comment._id)}
              style={{ color: "gray" }}
            >
              Reply
            </p>

            {(userId === comment.userId?._id ||
              userId === post.userId?._id) && (
              <p
                onClick={() => deleteComment(comment._id)}
                style={{ color: "red", cursor: "pointer", marginLeft: "10px" }}
              >
                Delete
              </p>
            )}

            {userId !== comment.userId._id && (
              <>
                <p
                  onClick={() => {
                    setReportedCommentId(comment._id);
                    setOpen(true);
                  }}
                  style={{
                    color: "red",
                    cursor: "pointer",
                    marginLeft: "10px",
                  }}
                >
                  Report
                </p>

                {open && (
                  <div className="modal">
                    <div
                      className="modal-content"
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <input
                        type="text"
                        name="report"
                        placeholder="Enter Reson of report"
                        onChange={(e) => setReason(e.target.value)}
                        style={{ width: "300px" }}
                      />
                      <button
                        type="submit"
                        onClick={() => ReportComment(comment._id)}
                        style={{ color: "gray" }}
                      >
                        Report
                      </button>
                      <button
                        type="cancel"
                        onClick={() => setOpen(false)}
                        style={{ color: "gray" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {replyTo === comment._id && (
            <>
              <h5 style={{ marginTop: "10px" }}>
                @{comment.userId?.name ? comment.userId?.name : "Unknown User"}
              </h5>

              <div className="reply-input">
                <input
                  type="text"
                  placeholder="Enter Reply"
                  value={replyText}
                  required
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button onClick={() => sendReply(comment._id)}>Reply</button>
              </div>
            </>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <>
              <h3
                className="show-replies"
                onClick={() => toggleReplies(comment._id)}
              >
                {expandedComments[comment._id]
                  ? "Hide Replies"
                  : `Show ${comment.replies.length} Replies`}
              </h3>
              {expandedComments[comment._id] && (
                <div className="reply-section">
                  {renderComments(comment.replies, level + 1)}
                </div>
              )}
            </>
          )}
        </div>
        <span
          onClick={() => addToFavourite(comment._id)}
          style={{
            color: like.includes(comment._id) ? "red" : "gray",
            cursor: "pointer",
          }}
        >
          <FaHeart size={13} />
          <h5 style={{ marginTop: "0px", color: "black" }}>
            <p style={{ fontSize: "10px", marginTop: "0px" }}>
              {comment.likes?.length || 0}
            </p>
          </h5>
        </span>
      </div>
    ));
  };

  const removeCommentById = (comments, commentId) => {
    return comments
      .map((comment) => {
        if (comment._id === commentId) {
          return null;
        }

        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: removeCommentById(comment.replies, commentId),
          };
        }

        return comment;
      })
      .filter(Boolean);
  };

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setComments((prevComments) =>
          removeCommentById(prevComments, commentId)
        );
      }
    } catch (error) {
      console.error("Error deleting comment : ", error);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };
  return (
    <>
      <Header />
      <div className="scroll-container">
        <div className="detail-container">
          <BiDownload onClick={generatePdf} className="download" />
          <h2>{post.title}</h2>
          <p>
            <strong>Description:</strong> {post.description}
          </p>
          <p>
            <strong>Country:</strong> {post.country}
          </p>
          <p>
            <strong>Category:</strong> {post.category}
          </p>
          <p>
            <strong>Rating:</strong>
            {avgRating > 0
              ? Array.from({ length: Math.round(avgRating) }, () => "⭐").join(
                  ""
                )
              : "0 Rating"}
            {avgRating > 0 && avgRating.toFixed(1)}[{post.review?.length}{" "}
            reviews]
          </p>

          <p className="post-info">Added By: {name ? name : "Unknown"}</p>

          <div className="hashtag-container">
            {text?.length > 0
              ? text.map((tag, index) => (
                  <span key={index} className="hashtag">
                    <Link
                      to={`/hashtag/${tag.replace("#", "")}`}
                      key={index}
                      className="link"
                    >
                      {tag}
                    </Link>
                  </span>
                ))
              : ""}
          </div>

          <img
            src={`http://localhost:8000/${post.image}`}
            alt="img"
            style={{ width: "100%" }}
            onClick={() => setIsModelOpen(true)}
          />

          <div className="image-grid">
            {moreImage.map((image, index) => (
              <div key={index} className="image-container">
                <img
                  src={`http://localhost:8000/${image}`}
                  alt="img"
                  className="image2"
                  onClick={() => handleImageClick(image)}
                />
              </div>
            ))}
          </div>

          <div className="comment-section">
            <h3>Comments</h3>
            <div className="comment-input">
              <input
                type="text"
                name="comment"
                placeholder="Enter Comment..."
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={sendComment}>Post</button>
            </div>

            {comments.length > 0 ? (
              <>
                <p onClick={() => setShowAllComments((prev) => !prev)}>
                  {showAllComments ? "Close Comments" : "View Comments"}
                </p>
                {showAllComments && renderComments(comments)}
              </>
            ) : (
              <h5>No Comments</h5>
            )}
          </div>

          {selectedImage && (
            <div className="modal" onClick={closeModal}>
              <div className="modal-content">
                <span onClick={closeModal} style={{ cursor: "pointer" }}>
                  &times;
                </span>
                <img
                  src={`http://localhost:8000/${selectedImage}`}
                  alt="Full size"
                  className="modal-image"
                />
              </div>
            </div>
          )}

          {isModelOpen && (
            <div className="modal" onClick={() => setIsModelOpen(false)}>
              <div className="modal-content">
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => setIsModelOpen(false)}
                >
                  &times;
                </span>
                <img
                  src={`http://localhost:8000/${post.image}`}
                  className="modal-image"
                  alt="img"
                />
              </div>
            </div>
          )}

          <div className="comment-section">
            <h3>Add Your Trip Images</h3>

            <Experience postId={post._id} />
          </div>

          <AddReview postid={post._id} />

          {location && (
            <div className="map-container">
              <h3>Location on Map</h3>

              <MapContainer
                center={[location.lat, location.lng]}
                zoom={10}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker
                  position={[location.lat, location.lng]}
                  icon={customIcon}
                >
                  <Popup>
                    {post.title}, {post.country}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {suggestedPost.length > 0 && (
            <>
              <h3>Suggested Places</h3>
              <ul>
                {suggestedPost.map((posts, index) => (
                  <li key={index} style={{ marginLeft: "0px" }}>
                    <Link to={`/${posts._id}/detail`} className="link">
                      Title: {posts.title}
                      <br /> <br />
                      <img
                        src={`http://localhost:8000/${posts.image}`}
                        className="li-image"
                        alt="img"
                      />
                      <br /> <br />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
