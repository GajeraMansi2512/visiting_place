import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../header";

export default function HashtagPosts() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetch(`http://localhost:8000/hashtag/${tag}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error fetching tag posts:", err));
  }, [tag, token]);

  return (
    <div>
      <Header />
      <h2 className="h2">Posts with #{tag}</h2>
      <ul>
        {posts.length > 0 ? (
          posts.map((post) => (
            <li key={post._id}>
              <Link to={`/${post._id}/detail`} className="link">
                <img
                  src={`http://localhost:8000/${post.image}`}
                  alt={post.title}
                  className="li-image"
                />
                <h3>{post.title}</h3>
              </Link>
            </li>
          ))
        ) : (
          <p>No posts found with this hashtag.</p>
        )}
      </ul>
    </div>
  );
}
