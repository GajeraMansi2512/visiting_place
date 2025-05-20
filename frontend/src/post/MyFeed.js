import { useEffect, useState } from "react";
import Header from "../header";
import { Link } from "react-router-dom";
import Report from "./report";

export default function MyFeed() {
  const [post, setPost] = useState([]);
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };
  const [menuOpen, setMenuOpen] = useState(null);
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    setLoading(true);

    const getPost = () => {
      fetch("http://localhost:8000/feed", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((post) => {
          setPost(post);
          setLoading(false);
        });
    };
    getPost();
  }, [token]);

  return (
    <>
      <Header />
      <h2 className="h2">My Feed</h2>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
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
      )}
    </>
  );
}
