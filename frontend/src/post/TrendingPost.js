import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../header";
import Report from "./report";

export default function TrendingPost() {
  const [post, setPost] = useState([]);
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    setLoading(true);
    const getPost = () => {
      fetch("http://localhost:8000/trending", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setPost(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching posts:", error);
          setLoading(false);
        });
    };
    getPost();
  }, [token]);

  return (
    <>
      <Header />
      <h2 className="h2">Trending Posts</h2>
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : post.length > 0 ? (
        <ul>
          {post.map((posts, index) => (
            <li key={index}>
              <div className="menu-containers">
                <button
                  onClick={() => toggleMenu(posts._id)}
                  className="menu-button"
                >
                  ⋮
                </button>
                <Report id={posts._id} userId={posts} menuOpen={menuOpen} />
              </div>
              <Link to={`/${posts._id}/detail`} className="link">
                <strong>Title:</strong> {posts.title}
                <br />
                <img
                  src={`http://localhost:8000/${posts.image}`}
                  className="li-image"
                  alt="img"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No trending posts available.</p>
      )}
    </>
  );
}
