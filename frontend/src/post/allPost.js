import { useEffect, useState } from "react";
import Header from "../header";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import profile from "../profile.png";
import Report from "./report";

export default function AllPost() {
  const [post, setPost] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favourite, setFavourite] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [place, setPlace] = useState("");
  const [country, setCountry] = useState([]);
  const [categoryPlace, setCategoryPlace] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const searchParam = search ? `&search=${search}` : "";
  const categoryParam = category ? `&category=${category}` : "";
  const placeParam = place ? `&place=${place}` : "";

  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  useEffect(() => {
    setLoading(true);
    fetch(
      `http://localhost:8000/getallpost?page=${currentPage}${searchParam}${categoryParam}${placeParam}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setPost(Array.isArray(data.post) ? data.post : []);
        setTotalPages(data.totalPages || 1);
        setCountry(data.countryImages);
        setCategoryPlace(data.category);
        setLoading(false);
        sessionStorage.setItem("userId", data.userId);
      })
      .catch((err) => {
        console.error("Error fetching posts:", err);
        setLoading(false);
      });

    fetch(`http://localhost:8000/favourite`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFavourite(data.map((fav) => fav._id)))
      .catch((err) => console.error("Error fetching favourites:", err));
  }, [token, currentPage, searchParam, category, categoryParam, placeParam]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    }
  };

  const addToFavourite = (id) => {
    fetch(`http://localhost:8000/${id}/favourite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setFavourite(data))
      .catch((err) => console.error("Error adding to favourites:", err));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  return (
    <>
      <Header />
      <input
        type="search"
        name="search"
        placeholder="search"
        onChange={handleSearch}
        className="searchinput"
      />
      <select
        onChange={(e) => setCategory(e.target.value)}
        style={{ marginRight: "20px", height: "30px", width: "200px" }}
        className="category"
      >
        <option value="">Country</option>
        {country.map((country, index) => (
          <option key={index} value={country._id}>
            {country._id}
          </option>
        ))}
      </select>

      <select
        className="category"
        onChange={(e) => setPlace(e.target.value)}
        style={{ marginRight: "10px", height: "30px", width: "200px" }}
      >
        <option value="">Category</option>
        {categoryPlace.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </select>

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
              <span
                onClick={() => addToFavourite(posts._id)}
                className="heart"
                style={{
                  color: favourite.includes(posts._id) ? "red" : "gray",
                  cursor: "pointer",
                }}
              >
                <FaHeart />
              </span>
              Title : {posts.title}
              <br /> <br />
              <img
                src={`http://localhost:8000/${posts.image}`}
                className="li-image"
                alt="img"
              />
              <div className="review-items">
                <Link to={`/${posts.userId._id}/account`} className="link">
                  Added By :
                  <img
                    src={
                      posts.userId?.profile
                        ? `http://localhost:8000/${posts.userId?.profile}`
                        : profile
                    }
                    alt="img"
                    className="profile-pic"
                  />
                  <span>
                    {posts.userId?.name ? posts.userId?.name : "Unknown"}
                  </span>
                </Link>
              </div>
              <button onClick={() => navigate(`/${posts._id}/detail`)}>
                Detail
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ textAlign: "center" }}>No Products Found</p>
      )}

      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </>
  );
}
