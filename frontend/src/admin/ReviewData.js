import React, { useEffect, useState } from "react";
import "../css/index.css";
import AdminHeader from "./adminHeader";
import { FaDeleteLeft } from "react-icons/fa6";

const ReviewData = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParam = search ? `&search=${search}` : "";

  useEffect(() => {
    fetchReviews();
  }, [searchParam]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/admin/review?${searchParam}`
      );
      const data = await response.json();
      setReviews(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching reviews :", error);
      setLoading(false);
    }
  };

  const deleteReview = (reviewId, postId) => {
    fetch(`http://localhost:8000/admin/review/${postId}/${reviewId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        fetchReviews();
      })
      .catch((error) => console.error("Error Deleting review:", error));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  if (loading) return <p>Loading reviews...</p>;

  return (
    <div>
      <AdminHeader />
      <input
        type="search"
        name="search"
        placeholder="Search Review"
        onChange={handleSearch}
        className="input"
      />
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Post Title</th>
            <th>Comment</th>
            <th>Rating</th>
            <th>User</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <tr key={review.reviewId}>
                <td>{index + 1}</td>
                <td>{review.postTitle}</td>
                <td>{review.comment}</td>
                <td>{review.rating} ⭐</td>
                <td>
                  {review.username} ({review.userEmail})
                </td>
                <td>
                  <FaDeleteLeft
                    className="delete"
                    onClick={() => deleteReview(review.reviewId, review.postId)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No reviews available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewData;
