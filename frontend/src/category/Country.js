import { useEffect, useState } from "react";
import Header from "../header";
import { Link, useParams } from "react-router-dom";
import Report from "../post/report";

export default function Country() {
  const { country } = useParams();
  const [post, setPost] = useState([]);
  const token = sessionStorage.getItem("token");
  const [categoryPlace, setCategoryPlace] = useState([]);
  const [place, setPlace] = useState([]);
  const placeParam = place ? `&place=${place}` : "";
  const [loading, setLoading] = useState(true);
  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    setLoading(true);

    const getCountryPost = () => {
      fetch(`http://localhost:8000/${country}/getpost?${placeParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setPost(Array.isArray(data.post) ? data.post : []);
          setCategoryPlace(data.category);
          setLoading(false);
        })
        .catch((error) => console.error("Error fetching Posts :", error));
    };
    getCountryPost();
  }, [token, country, placeParam]);

  return (
    <>
      <Header />
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <select
            onChange={(e) => setPlace(e.target.value)}
            className="country"
          >
            <option value="">Category</option>
            {categoryPlace.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
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
                  {posts.title}
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
    </>
  );
}
