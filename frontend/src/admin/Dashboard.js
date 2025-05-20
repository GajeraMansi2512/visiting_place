import React, { useEffect, useState } from "react";
import "../css/index.css";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { BsDatabaseAdd } from "react-icons/bs";
import AdminHeader from "./adminHeader";
import { MdReviews } from "react-icons/md";

function Dashboard() {
  const [user, setUser] = useState([]);
  const [post, setPost] = useState([]);
  const [review, setReview] = useState([]);
  const [admin, setAdmin] = useState([]);

  useEffect(() => {
    const getPost = async () => {
      try {
        const res = await fetch("http://localhost:8000/dashboard");
        const data = await res.json();
        setPost(data.post);
        setUser(data.user);
        setReview(data.review);
        setAdmin(data.admin);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    getPost();
  }, []);

  return (
    <div className="admin-container">
      <AdminHeader />
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <Link to="/userdata" className="dashboard">
            <div className="stat-box">
              <FaUser className="image" />
              <br></br>
              Users <span>{user.length}</span>
            </div>
          </Link>
          <Link to="/postdata" className="dashboard">
            <div className="stat-box">
              <BsDatabaseAdd className="image" />
              <br></br>
              Posts <span>{post.length}</span>
            </div>
          </Link>
          <Link to="/admin/review" className="dashboard">
            <div className="stat-box">
              <MdReviews className="image" />
              <br></br>
              Reviews <span>{review}</span>
            </div>
          </Link>
          {/* <Link to="/adminData" className="dashboard">
            <div className="stat-box">
              <GrUserAdmin className="image" />
              <br></br>
              Admin <span>{admin.length}</span>
            </div>
          </Link> */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
