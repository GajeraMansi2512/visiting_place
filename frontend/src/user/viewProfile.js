import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import profile from "../profile.png";
import ViewPost from "../post/viewPost";

export default function ViewProfile() {
  const [user, setUser] = useState({});
  const token = sessionStorage.getItem("token");
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [open, setopen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [follower, setFollower] = useState([]);
  const [followOpen, setfollowOpen] = useState();
  const [follow, setFollow] = useState([]);
  const [blockUser, SetBlockuser] = useState([]);
  const [openBlock, setOpenBlock] = useState(false);
  const navigate = useNavigate();
  const [menuOpens, setMenuOpens] = useState(null);

  useEffect(() => {
    setLoading(true);

    const fetchFollowing = () => {
      fetch("http://localhost:8000/following", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setFollow(data);
        });
    };

    fetchFollowing();
  }, [token]);

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
        setCount(data.count);
      });
  };

  useEffect(() => {
    setLoading(true);

    const getUser = () => {
      fetch("http://localhost:8000/viewprofile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data.user);
          setCount(data.count);
          setFollower(data.followers);
          setLoading(false);
        });
    };

    getUser();
  }, [token, count]);

  const handleImageClick = () => setIsModelOpen(true);
  const handleCloseModel = () => setIsModelOpen(false);

  const GetBlockUser = () => {
    fetch(`http://localhost:8000/getblockuser`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((user) => {
        SetBlockuser(user.block);
      });
  };

  useEffect(() => {
    GetBlockUser();
  }, []);

  const BlockUser = (userId) => {
    fetch(`http://localhost:8000/${userId}/block`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(() => {
        SetBlockuser((prev) => prev.filter((user) => user._id !== userId));
      });
  };

  return (
    <>
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                marginRight: "40px",
                marginLeft: "100px",
                marginTop: "10px",
              }}
            >
              <img
                src={
                  user.profile
                    ? `http://localhost:8000/${user.profile}`
                    : `${profile}`
                }
                alt="img"
                className="profile-avatarss"
                onClick={handleImageClick}
              />
            </div>
            <div style={{ textAlign: "left" }}>
              <h3> {user.name ? user.name : ""}</h3>
              <p> {count} Posts</p>
              <span
                style={{ marginRight: "10px" }}
                onClick={() => setopen(true)}
              >
                {user.follow?.length} Following{" "}
              </span>
              <span onClick={() => setfollowOpen(true)}>
                {follower?.length} Follower{" "}
              </span>
              <div className={`dropdown-containers ${menuOpens ? "show" : ""}`}>
                <button
                  className="dropdown-buttons"
                  onClick={() => setMenuOpens(!menuOpens)}
                >
                  More
                </button>

                <div
                  className="dropdown-menus"
                  onClick={() => setMenuOpens(!menuOpens)}
                >
                  <Link to="/editprofile">Edit Profile</Link>
                  <Link to="/archive">Archive Posts</Link>
                  <button onClick={() => setOpenBlock(true)}>
                    Blocked Users
                  </button>
                  <button
                    onClick={() =>
                      navigate("/sharepost", {
                        state: { profileToShare: user._id },
                      })
                    }
                  >
                    Share Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ViewPost />
        </div>
      )}

      {open && (
        <div className="model">
          <span className="close" onClick={() => setopen(false)}>
            &times;
          </span>
          <div className="follow-contents">
            {user.follow.map((i) => (
              <div>
                <div className="menu-containers">
                  <></>
                </div>
                <div
                  key={i._id}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Link className="follow-user" to={`/${i._id}/account`}>
                    <img
                      src={
                        i.profile
                          ? `http://localhost:8000/${i.profile}`
                          : `${profile}`
                      }
                      className="profile-avatars"
                      alt="img"
                    />
                    <p>{i.name ? i.name : "Unknown"}</p>
                  </Link>
                  <button
                    onClick={() => followUser(i._id)}
                    className="button"
                    style={{
                      backgroundColor: follow.includes(i._id) ? "red" : "blue",
                    }}
                  >
                    {follow.includes(i._id) ? "Unfollow" : "Follow"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {openBlock && (
        <div className="model">
          <span className="close" onClick={() => setOpenBlock(false)}>
            &times;
          </span>
          <div className="follow-contents">
            {blockUser.map((i, index) => (
              <>
                <div
                  key={index}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", gap: "15px" }}>
                    <img
                      src={
                        i.profile
                          ? `http://localhost:8000/${i.profile}`
                          : `${profile}`
                      }
                      className="profile-avatars"
                      alt="img"
                    />
                    <p>{i.name ? i.name : "Unknown"}</p>
                  </div>
                  <button onClick={() => BlockUser(i._id)} className="button">
                    Unblock
                  </button>
                </div>
              </>
            ))}
          </div>
        </div>
      )}

      {followOpen && (
        <div className="model" onClick={() => setfollowOpen(false)}>
          <span className="close" onClick={() => setfollowOpen(false)}>
            &times;
          </span>
          <div className="follow-contents">
            {follower.map((i) => (
              <>
                <div key={i._id}>
                  <Link className="follow-user" to={`/${i._id}/account`}>
                    <img
                      src={
                        i.profile
                          ? `http://localhost:8000/${i.profile}`
                          : `${profile}`
                      }
                      className="profile-avatars"
                      alt="img"
                    />
                    <p>{i.name ? i.name : "Unknown"}</p>
                  </Link>
                </div>
              </>
            ))}
          </div>
        </div>
      )}

      {isModelOpen && (
        <div className="modals" onClick={handleCloseModel}>
          <div className="modal-contents">
            <span className="close" onClick={handleCloseModel}>
              &times;
            </span>
            <img
              src={`http://localhost:8000/${user.profile}`}
              className="profile-avtar"
              alt="img"
            />
          </div>
        </div>
      )}
    </>
  );
}
