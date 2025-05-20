import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import hero1 from "./hero5.jpg";
import hero2 from "./hero4.jpg";
import hero3 from "./hero2.jpg";
import "./css/home.css";
import Header from "./header";
import PlacesMap from "./MapComponent";

function Home() {
  const [country, setCountry] = useState([]);
  const [post, setPost] = useState([]);
  const [currentHero, setCurrentHero] = useState(0);
  const token = sessionStorage.getItem("token");
  const countryname = "India";
  const heroImages = [hero1, hero2, hero3];
  const [indiaPost, setIndiaPost] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const countryRef = useRef(null);
  const postRef = useRef(null);
  const indiaRef = useRef(null);
  const categoriesRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/getallpost`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCountry(data.countryImages);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    fetch("http://localhost:8000/trending", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPost(Array.isArray(data) ? data : []));
  }, [token]);

  useEffect(() => {
    fetch(`http://localhost:8000/${countryname}/getpost`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setIndiaPost(Array.isArray(data.post) ? data.post : []);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching Posts:", error));
  }, [token, country]);

  useEffect(() => {
    fetch("http://localhost:8000/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => console.error("Error loading categories", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  const scroll = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollLeft += direction === "left" ? -300 : 300;
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      fetch(`http://localhost:8000/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.posts || []);
          setLoading(false);
        })
        .catch((err) => console.error("Error fetching search results", err));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPost = (postId) => {
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/${postId}/detail`);
  };

  return (
    <>
      <Header />

      <div className="hero-container">
        {heroImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Hero ${index + 1}`}
            style={{
              opacity: index === currentHero ? 1 : 0,
              position: "absolute",
            }}
          />
        ))}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search posts by name, country, or category..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((post) => (
                <li key={post._id} onClick={() => handleSelectPost(post._id)}>
                  {post.title} - {post.country} ({post.category})
                </li>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="list-wrapper">
        <h3>Countries to Explore</h3>
        <button
          className="scroll-btn left"
          onClick={() => scroll(countryRef, "left")}
        >
          &lt;
        </button>
        <div ref={countryRef} className="list-container">
          {country.map((category, index) => (
            <div key={index} className="list-item">
              <Link to={`/${category._id}/post`} className="link">
                {category._id}
                <br />
                {category.image && (
                  <img
                    src={`http://localhost:8000/${category.image}`}
                    alt={category._id}
                  />
                )}
              </Link>
            </div>
          ))}
        </div>
        <button
          className="scroll-btn right"
          onClick={() => scroll(countryRef, "right")}
        >
          &gt;
        </button>
      </div>

      <div className="list-wrapper">
        <h3>Trending Places</h3>
        <button
          className="scroll-btn left"
          onClick={() => scroll(postRef, "left")}
        >
          &lt;
        </button>
        <div ref={postRef} className="list-container">
          {post?.length > 0 ? (
            post?.map((posts, index) => (
              <div key={index} className="list-item">
                <Link to={`/${posts._id}/detail`} className="link">
                  {posts.title}
                  <br />
                  <img
                    src={`http://localhost:8000/${posts.image}`}
                    alt="Post"
                  />
                </Link>
              </div>
            ))
          ) : (
            <p>No trending posts available.</p>
          )}
        </div>
        <button
          className="scroll-btn right"
          onClick={() => scroll(postRef, "right")}
        >
          &gt;
        </button>
      </div>

      <div className="list-wrapper">
        <h3>Places To Visit in India</h3>
        <button
          className="scroll-btn left"
          onClick={() => scroll(indiaRef, "left")}
        >
          &lt;
        </button>
        <div ref={indiaRef} className="list-container">
          {indiaPost.length > 0 ? (
            indiaPost.map((posts, index) => (
              <div key={index} className="list-item">
                <Link to={`/${posts._id}/detail`} className="link">
                  {posts.title}
                  <br />
                  <img
                    src={`http://localhost:8000/${posts.image}`}
                    alt="Post"
                  />
                </Link>
              </div>
            ))
          ) : (
            <p>No trending posts available.</p>
          )}
        </div>
        <button
          className="scroll-btn right"
          onClick={() => scroll(indiaRef, "right")}
        >
          &gt;
        </button>
      </div>

      <div className="list-wrapper">
        <h3>Destinations By Theme</h3>
        <button
          className="scroll-btn left"
          onClick={() => scroll(categoriesRef, "left")}
        >
          &lt;
        </button>
        <div id="trendingList" ref={categoriesRef} className="list-container">
          {indiaPost?.length > 0 ? (
            categories?.map((cat, index) => (
              <div key={index} className="list-item">
                <Link to={`/posts/${cat._id}`} className="link">
                  {cat._id}
                  <br></br>
                  <img src={`http://localhost:8000/${cat.image}`} alt="Post" />
                </Link>
              </div>
            ))
          ) : (
            <p>No Destinations posts available.</p>
          )}
        </div>
        <button
          className="scroll-btn right"
          onClick={() => scroll(categoriesRef, "right")}
        >
          &gt;
        </button>
      </div>
      <PlacesMap />
    </>
  );
}

export default Home;
