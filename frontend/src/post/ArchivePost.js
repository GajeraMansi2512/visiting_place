import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../header";

export default function ArchivePost() {
  const [post, setPost] = useState([]);
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/getarchive", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((post) => {
        setPost(post);
        setLoading(false);
      });
  }, [token]);

  const ArchivePost = (id) => {
    fetch(`http://localhost:8000/${id}/archive`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() =>
        setPost((prevPost) => prevPost.filter((item) => item._id !== id))
      );
  };

  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <Header />
      <h2 className="h2">Archive Posts :</h2>
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <ul>
          {post.map((posts) => (
            <li key={posts._id} className="post-item">
              <div className="post-header">
                <Link to={`/${posts._id}/detail`} className="link">
                  <strong></strong> {posts.title}
                </Link>

                <div className="menu-container">
                  <button
                    onClick={() => toggleMenu(posts._id)}
                    className="menu-button"
                  >
                    ⋮
                  </button>

                  {menuOpen === posts._id && (
                    <div className="menu-dropdown">
                      <button
                        onClick={() => ArchivePost(posts._id)}
                        className="link"
                      >
                        UnArchive
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Link to={`/${posts._id}/detail`} className="link">
                <img
                  src={`http://localhost:8000/${posts.image}`}
                  className="li-image"
                  alt="img"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
