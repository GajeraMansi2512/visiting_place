import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../header";
import Report from "../post/report";

function CategoryName() {
  const [posts, setPosts] = useState([]);
  const { category } = useParams();
  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    if (!category) return;

    fetch(`http://localhost:8000/posts/${category}`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error loading posts", err));
  }, [category]);

  if (posts.length < 0) {
    return <h2>No Posts</h2>;
  }

  return (
    <>
      <Header />
      <h2 className="h2">{category}</h2>
      <ul>
        {posts?.map((post) => (
          <li key={post._id}>
            <div className="menu-containers">
              <button
                onClick={() => toggleMenu(post._id)}
                className="menu-button"
              >
                ⋮
              </button>
              <Report id={post._id} userId={post} menuOpen={menuOpen} />
            </div>
            <Link to={`/${post._id}/detail`} className="link">
              <img
                src={`http://localhost:8000/${post.image}`}
                alt="img"
                className="li-image"
              />
              <h3>{post.title}</h3>
              <p>{post.description.substring(0, 100)}...</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default CategoryName;
