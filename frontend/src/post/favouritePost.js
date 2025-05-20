import { useEffect, useState } from "react";
import Header from "../header";
import { Link } from "react-router-dom";

export default function FavouritePost() {
  const [post, setPost] = useState([]);
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const getPost = () => {
      fetch("http://localhost:8000/favourite", {
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

  const deletePost = (id) => {
    fetch(`http://localhost:8000/${id}/remove/favourite`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((post) =>
        setPost((prevPost) => prevPost.filter((item) => item._id !== id))
      );
  };

  return (
    <>
      <Header />
      <h2 className="h2">Favourite Posts</h2>
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <ul>
          {post.map((posts, index) => (
            <li key={index}>
              <Link to={`/${posts._id}/detail`} className="link">
                {posts.title}
                <br /> <br />
                <img
                  src={`http://localhost:8000/${posts.image}`}
                  className="li-image"
                  alt="img"
                />
                <br /> <br />
              </Link>

              <button onClick={() => deletePost(posts._id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
