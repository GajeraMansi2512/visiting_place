import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import {
  FiGlobe,
  FiHeart,
  FiList,
  FiLogOut,
  FiPlus,
  FiUser,
  FiUsers,
  FiChevronRight,
  FiLogIn,
  FiMessageCircle,
} from "react-icons/fi";
import { MdFeed, MdGroups } from "react-icons/md";
import profile from "./profile.png";
import { CgTrending } from "react-icons/cg";
import { BiHome } from "react-icons/bi";
import { ThemeContext } from "./ThemeContext";

export default function Header() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const image = sessionStorage.getItem("profile");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({});
  const { theme, toggleTheme } = useContext(ThemeContext);

  const isTokenExpired = () => {
    if (!token) return true;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    if (token) {
      fetch("http://localhost:8000/viewprofile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data.user);
        });
    }
  }, [token]);

  const logout = () => {
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        logout();
      }
    }, 100000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        !document.querySelector(".sidebar").contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowLogin(false);
    }
  }, [isOpen]);

  const handleLogin = (type) => {
    sessionStorage.setItem("login", type);
    setShowLogin(false);
    setIsOpen(false);
    navigate("/login");
  };

  return (
    <>
      {token && !isTokenExpired() ? (
        <>
          <div className={`sidebar ${isOpen ? "open" : ""}`}>
            <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
              <FiChevronRight size={30} />
            </button>
            <nav>
              <div className="profile-section">
                <img
                  src={image ? `http://localhost:8000/${image}` : profile}
                  alt="Profile"
                  className="profile-avatar"
                />
                {isOpen && (
                  <h3 className="username">{user.name || "Unknown"}</h3>
                )}
                {isOpen && (
                  <div className="theme-toggle-container">
                    <input
                      type="checkbox"
                      id="theme-toggle"
                      className="theme-toggle"
                      checked={theme === "dark"}
                      onChange={toggleTheme}
                    />
                    <label htmlFor="theme-toggle" className="toggle-label">
                      <span className="toggle-ball"></span>
                    </label>
                  </div>
                )}
              </div>
              <Link to="/home">
                <BiHome /> {isOpen && "Home"}
              </Link>
              <Link to="/addpost">
                <FiPlus /> {isOpen && "Add Post"}
              </Link>
              <Link to="/allpost">
                <FiList /> {isOpen && "All Post"}
              </Link>

              <Link to="/feed">
                <MdFeed /> {isOpen && "Feed"}
              </Link>
              <Link to="/trending">
                <CgTrending /> {isOpen && "Trending Post"}
              </Link>
              <Link to="/favourite">
                <FiHeart /> {isOpen && "Favourite"}
              </Link>
              <Link to="/category">
                <FiGlobe /> {isOpen && "Country"}
              </Link>
              <Link to="/alluser">
                <FiUsers /> {isOpen && "Suggested User"}
              </Link>
              <Link to="/profile">
                <FiUser /> {isOpen && "My Profile"}
              </Link>
              <Link to="/personal">
                <FiMessageCircle /> {isOpen && "Message"}
              </Link>
              <Link to="/message">
                <MdGroups /> {isOpen && "Group Chat"}
              </Link>
              <Link to="/login" onClick={logout}>
                <FiLogOut /> {isOpen && "Logout"}
              </Link>
            </nav>
          </div>
        </>
      ) : (
        <div className={`sidebar ${isOpen ? "open" : ""}`}>
          <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
            <FiChevronRight size={30} />
          </button>
          <nav>
            <div>
              <Link to="/" className="nav-link">
                <FiUser className="nav-icon" /> {isOpen && <span>Sign Up</span>}
              </Link>
            </div>
            <div>
              <Link to="/login" className="nav-link">
                <FiLogIn className="nav-icon" /> {isOpen && <span>Login</span>}
              </Link>
            </div>
            {/* <div className="nav-item login-dropdown">
            <div
              className="login-trigger"
              onClick={() => setShowLogin((prev) => !prev)}
            >
              <FiLogIn className="nav-icon" />
              {isOpen && <span className="login-text">Login</span>}
            </div>
            {showLogin && (
              <div className="login-options">
                <button onClick={() => handleLogin("login")}>User Login</button>
                <button onClick={() => handleLogin("admin-login")}>
                  Admin Login
                </button>
              </div>
            )}
          </div> */}
          </nav>
        </div>
      )}
    </>
  );
}
