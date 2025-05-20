import React, { useEffect, useState } from "react";
import "../css/index.css";
import Header from "../header";
import { Link } from "react-router-dom";
import profile from "../profile.png";

function AllUser() {
  const [users, setUsers] = useState([]);
  const [follow, setFollow] = useState([]);
  const token = sessionStorage.getItem("token");
  const [search, setSearch] = useState([]);
  const searchParam = search ? `&search=${search}` : "";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchUsers = () => {
      fetch(`http://localhost:8000/user?${searchParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUsers(data);
          setLoading(false);
        });
    };

    const fetchFollowing = () => {
      fetch("http://localhost:8000/following", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setFollow(data);
        });
    };

    fetchUsers();
    fetchFollowing();
  }, [token, searchParam]);

  const followUser = (id) => {
    fetch(`http://localhost:8000/${id}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFollow(data.user);
      });
  };

  return (
    <div>
      <Header />
      <input
        type="text"
        name="search"
        style={{ width: "390px" }}
        placeholder="Search User"
        className="usersearch"
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="suggested-users">
        <h3>Suggested Users</h3>

        <br></br>
        <br></br>
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {users.map((user) => (
              <div key={user._id} className="suggested-user">
                <Link to={`/${user._id}/account`} className="link">
                  <img
                    src={
                      user.profile
                        ? `http://localhost:8000/${user.profile}`
                        : profile
                    }
                    alt="img"
                    className="profile-avatars"
                  />
                  <span>{user.name ? user.name : "Unknown"}</span>
                </Link>
                <Link to={`/${user._id}/account`} className="link"></Link>

                <button
                  onClick={() => followUser(user._id)}
                  style={{
                    backgroundColor: follow.includes(user._id) ? "red" : "blue",
                  }}
                >
                  {follow.includes(user._id) ? "Unfollow" : "Follow"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default AllUser;
