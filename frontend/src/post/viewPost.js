import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ViewPost() {
  const [post, setPost] = useState([]);
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/viewpost", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((post) => {
        setPost(post);
        setLoading(false);
      });
  }, [token]);

  const deletePost = (deleteId) => {
    fetch(`http://localhost:8000/${deleteId}/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() =>
        setPost((prevPost) => prevPost.filter((item) => item._id !== deleteId))
      );
  };

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
                  {posts.title}
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
                      <Link to={`/${posts._id}/edit`} className="link">
                        Edit
                      </Link>
                      <button
                        onClick={() => ArchivePost(posts._id)}
                        className="link"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => deletePost(posts._id)}
                        className="link"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          navigate("/sharepost", { state: { post: posts } })
                        }
                        className="link"
                      >
                        Share
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
