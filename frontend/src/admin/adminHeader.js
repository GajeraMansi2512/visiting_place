import { Link } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaHome } from "react-icons/fa";
import { BsDatabaseAdd } from "react-icons/bs";
import { MdReviews } from "react-icons/md";
import { useEffect, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { CgUserAdd } from "react-icons/cg";

export default function AdminHeader() {
  const logout = () => {
    sessionStorage.removeItem("adminToken");
  };
  const [isOpen, setIsOpen] = useState(false);
  const token = sessionStorage.getItem("adminToken");

  const [user, setUser] = useState({});

  useEffect(() => {
    const getUser = () => {
      fetch("http://localhost:8000/viewAdmin", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
        });
    };
    getUser();
  }, [token]);

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          <FiChevronRight size={30} />
        </button>
        <nav>
          <div className="profile-section">
            <img
              src={
                user.profile ? `http://localhost:8000/${user.profile}` : "img"
              }
              alt="Profile"
              className="profile-avatar"
            />
            {isOpen && <h3 className="username">{user.name || "Unknown"}</h3>}
          </div>
          <Link to="/dashboard">
            <FaHome /> {isOpen && "Dashboard"}
          </Link>
          <Link to="/userdata">
            <FaUser /> {isOpen && "Users"}
          </Link>
          <Link to="/postdata">
            <BsDatabaseAdd /> {isOpen && "Posts"}
          </Link>
          <Link to="/admin/review">
            <MdReviews /> {isOpen && "Review"}
          </Link>
          <Link to="/addPeople">
            <CgUserAdd /> {isOpen && "Add People"}
          </Link>
          <Link to="/login" onClick={logout}>
            <FaSignOutAlt /> {isOpen && "Logout"}
          </Link>
        </nav>
      </div>
    </>
  );
}
