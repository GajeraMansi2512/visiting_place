import { useEffect, useState } from "react";
import profile from "../profile.png";
import { Link } from "react-router-dom";
import { FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";

export default function AddReview({ postid }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const token = sessionStorage.getItem("token");
  const [review, setReview] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const userId = sessionStorage.getItem("userId");
  const upvoteReview = (reviewId) => {
    fetch(`http://localhost:8000/upvote/${postid}/${reviewId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((updatedReview) => {
        setReview((prevReview) =>
          prevReview.map((rev) =>
            rev._id === updatedReview._id ? updatedReview : rev
          )
        );
        setUserVotes((prevVotes) => ({
          ...prevVotes,
          [reviewId]: "upvoted",
        }));
      })
      .catch((err) => console.error("Error upvoting review:", err));
  };

  const downvoteReview = (reviewId) => {
    fetch(`http://localhost:8000/downvote/${postid}/${reviewId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((updatedReview) => {
        setReview((prevReview) =>
          prevReview.map((rev) =>
            rev._id === updatedReview._id ? updatedReview : rev
          )
        );
        setUserVotes((prevVotes) => ({
          ...prevVotes,
          [reviewId]: "downvoted",
        }));
      })
      .catch((err) => console.error("Error downvoting review:", err));
  };

  const postReview = (e) => {
    if (rating === 0 || comment === "") {
      alert("Give Rating");
      return;
    }
    e.preventDefault();
    fetch("http://localhost:8000/review", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating, comment, postid }),
    })
      .then((res) => res.json())
      .then((newReviews) => {
        setReview(newReviews);
        setComment("");
        setRating(0);
      })
      .catch((err) => console.error("Error posting reviews:", err));
  };

  useEffect(() => {
    const getReview = () => {
      if (!postid) return;
      fetch(`http://localhost:8000/getreview/${postid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((fetchedReviews) => setReview(fetchedReviews))
        .catch((err) => console.error("Error fetching reviews:", err));
    };
    getReview();
  }, [token, postid]);

  return (
    <>
      <form onSubmit={postReview} style={{ width: "auto" }}>
        <strong>Give Review & Rating</strong>
        <div style={{ marginTop: "20px" }} className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              className={star <= rating ? "star selected" : "star"}
              required
            >
              ★
            </span>
          ))}
        </div>
        <input
          type="text"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add Review...."
          required
        />
        <button type="submit">Add Review</button>
      </form>
      <div className="review-container">
        {(showAll ? review : review.slice(0, 2)).map((reviews, index) => (
          <div key={index} className="review-item">
            <p>
              <Link to={`/${reviews?.userId?._id}/account`} className="link">
                {reviews?.userId?.profile ? (
                  <img
                    src={`http://localhost:8000/${reviews.userId.profile}`}
                    alt="img"
                    className="profile-pic"
                  />
                ) : (
                  <img src={profile} alt="img" className="profile-pic" />
                )}
                {reviews?.userId?.name ? reviews.userId.name : "Unknown"}
              </Link>
            </p>
            <p>Review: {reviews?.comment}</p>
            <p>
              Rating:
              {Array.from(
                { length: Math.round(reviews.rating) },
                () => "⭐"
              ).join("")}
            </p>
            <p>
              <span
                style={{
                  color: reviews.upvotes.includes(userId) ? "lightgreen" : "",
                }}
                onClick={() => upvoteReview(reviews._id)}
              >
                <FaRegThumbsUp size={20} />
                {reviews.upvotes?.length}
              </span>

              <span
                style={{
                  color: reviews.downvotes.includes(userId) ? "red" : "",
                }}
                onClick={() => downvoteReview(reviews._id)}
              >
                <FaRegThumbsDown size={20} style={{ marginLeft: "10px" }} />
                {reviews.downvotes?.length}
              </span>
            </p>
          </div>
        ))}
        {review.length > 2 && (
          <button onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : "More Reviews"}
          </button>
        )}
      </div>
    </>
  );
}
