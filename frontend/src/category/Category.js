import { useEffect, useState } from "react";
import Header from "../header";
import { Link } from "react-router-dom";

export default function Category() {
  const [categories, setCategories] = useState([]);
  const token = sessionStorage.getItem("token");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const getPost = () => {
      fetch(`http://localhost:8000/getallpost`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setCategories(data.countryImages);
          setLoading(false);
        });
    };
    getPost();
  }, [token]);

  return (
    <>
      <Header />
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <ul>
          {categories.map((category, index) => (
            <li key={index}>
              <Link to={`/${category._id}/post`} className="link">
                {category._id}
                <br /> <br />
                {category.image && (
                  <img
                    src={`http://localhost:8000/${category.image}`}
                    alt={category._id}
                    className="li-image"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
