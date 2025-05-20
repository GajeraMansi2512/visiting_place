import React, { useEffect, useState } from "react";
import profile from "../profile.png";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, getUsers } from "../store/slice";
import Header from "../header";
import ViewPost from "../post/viewPost";
import MyProfile from "./MyProfile";

function Account() {
  const token = sessionStorage.getItem("token");
  const { id } = useParams();
  const dispatch = useDispatch();
  const [count, setCount] = useState(0);
  const [follow, setFollow] = useState([]);
  const [open, setOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allFollower, setAllFollower] = useState([]);
  const [followerOpen, setFollowerOpen] = useState(false);
  const [viewMutual, setViewMutual] = useState(false);
  const followState = useSelector((state) => state.follow);
  const post = followState.data?.post || [];
  const user = followState.data?.user || {};
  const loginUser = followState.data?.loginUser || {};
  const mutualUser = followState.data?.mutualconnection || {};
  const userId = sessionStorage.getItem("userId");
  const [follower, setFollower] = useState(0);
  const [blockUser, SetBlockuser] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();
  const handleImageClick = () => setIsModelOpen(true);
  const handleCloseModel = () => setIsModelOpen(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [countRes, followRes] = await Promise.all([
        fetch(`http://localhost:8000/${id}/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/following", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const countData = await countRes.json();
      const followData = await followRes.json();

      setCount(countData);
      setFollow(followData);
      const followerCount = async (userId) => {
        if (!userId) {
          console.error("Error: userId is undefined");
          return;
        }

        try {
          const response = await fetch(
            `http://localhost:8000/${userId}/follower`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          setFollower(data.count);
          setAllFollower(data.followers);
        } catch (error) {
          console.error("Error fetching followers:", error);
        }
      };

      followerCount(id);

      dispatch(clearUser());
      await dispatch(getUsers(id));
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (blockUser.length > 0 && id) {
      const isBlockedNow = blockUser.includes(id);
      setIsBlocked(isBlockedNow);
    }
  }, [blockUser, id]);

  useEffect(() => {
    fetchProfileData();
    return () => {
      dispatch(clearUser());
    };
  }, [id, dispatch, token]);

  const followUser = async (userId) => {
    try {
      await fetch(`http://localhost:8000/${userId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      await fetchProfileData();
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const BlockUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/${userId}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      SetBlockuser(Array.isArray(data.block) ? data.block : []);

      const isBlockedNow = data.block?.some((u) => u === id);

      setIsBlocked(isBlockedNow);

      await fetchProfileData();
    } catch (err) {
      console.error("Error blocking/unblocking user:", err);
    }
  };

  const GetBlockUser = async () => {
    try {
      const res = await fetch(`http://localhost:8000/getblockuser`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      SetBlockuser(data.block);
      if (data && data.block) {
        const blocked = data.block.some((u) => u === id);

        setIsBlocked(blocked);
      }
    } catch (err) {
      console.error("Error getting blocked users:", err);
    }
  };

  useEffect(() => {
    GetBlockUser();
  }, [token]);

  if (id === userId) {
    return <MyProfile />;
  }

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
          <div className="profile-containers">
            <img
              src={
                user.profile ? `http://localhost:8000/${user.profile}` : profile
              }
              alt="Profile"
              className="profile-avatarss"
              onClick={handleImageClick}
            />
            <div className="profile-detailss">
              <div className="profile-headers">
                <span style={{ fontWeight: "bold" }}>
                  {user.name || "Unknown"}
                </span>
                {userId !== user._id ? (
                  <>
                    {!isBlocked && (
                      <button
                        className={`follow-btn ${
                          follow.includes(user._id)
                            ? "following"
                            : "not-following"
                        }`}
                        onClick={() => followUser(user._id)}
                      >
                        {follow.includes(user._id) ? "Unfollow" : "Follow"}
                      </button>
                    )}
                    <button
                      className="follow-btn"
                      onClick={() => BlockUser(user._id)}
                    >
                      {isBlocked ? "Unblock" : "Block"}
                    </button>
                  </>
                ) : (
                  <Link to="/editprofile">
                    <button>Edit Profile</button>
                  </Link>
                )}
              </div>
              <div className="profile-stats">
                <span>{isBlocked ? "0" : count} Posts</span>
                <span onClick={() => !isBlocked && setOpen(true)}>
                  {isBlocked ? "0" : user.follow?.length} Following
                </span>
                <span onClick={() => !isBlocked && setFollowerOpen(true)}>
                  {isBlocked ? "0" : follower} Follower
                </span>
              </div>
              <br></br>
              <span onClick={() => setViewMutual(true)}>
                {mutualUser?.length} mutual connection
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <Link to={`/${user.name}/${user._id}`}>
                  {" "}
                  <button>Message</button>
                </Link>
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

          {userId !== user._id ? (
            <>
              {Array.isArray(user.follow) && loginUser?.follow?.includes(id) ? (
                <div className="posts-container">
                  {post.length > 0 ? (
                    post.map((posts) => (
                      <div key={posts._id} className="post-card">
                        <Link to={`/${posts._id}/detail`}>
                          <img
                            src={
                              posts.image
                                ? `http://localhost:8000/${posts.image}`
                                : profile
                            }
                            alt="Post"
                          />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <h1>No Posts</h1>
                  )}
                </div>
              ) : (
                <h1 className="private-profile-message">
                  You Don't Follow this User So You Can't See Their Posts.
                </h1>
              )}
            </>
          ) : (
            <ViewPost />
          )}
        </>
      )}

      {mutualUser.length > 0 && viewMutual && (
        <div className="model" onClick={() => setViewMutual(false)}>
          <span className="close" onClick={() => setViewMutual(false)}>
            &times;
          </span>
          <div className="follow-contents" style={{ width: "300px" }}>
            {mutualUser.map((user) => (
              <Link className="link" to={`/${user._id}/account`}>
                <div className="follow-user" key={user._id}>
                  <img
                    src={
                      user.profile
                        ? `http://localhost:8000/${user.profile}`
                        : profile
                    }
                    alt="Profile"
                    className="profile-avatars"
                  />
                  <p>{user.name || "Unknown"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="model">
          <span className="close" onClick={() => setOpen(false)}>
            &times;
          </span>
          <div className="follow-contents" style={{ width: "300px" }}>
            {user.follow.map((i) => (
              <div className="follow-user" key={i._id}>
                <img
                  src={
                    i.profile ? `http://localhost:8000/${i.profile}` : profile
                  }
                  className="profile-avatars"
                  alt="Profile"
                />
                <p>{i.name || "Unknown"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {followerOpen && (
        <div className="model">
          <span className="close" onClick={() => setFollowerOpen(false)}>
            &times;
          </span>
          <div className="follow-contents" style={{ width: "300px" }}>
            {allFollower.length > 0 ? (
              allFollower.map((i) => (
                <div className="follow-user" key={i._id}>
                  <img
                    src={
                      i.profile ? `http://localhost:8000/${i.profile}` : profile
                    }
                    className="profile-avatars"
                    alt="Profile"
                  />
                  <p>{i.name || "Unknown"}</p>
                </div>
              ))
            ) : (
              <h1>no follower</h1>
            )}
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
              src={
                user.profile ? `http://localhost:8000/${user.profile}` : profile
              }
              className="profile-avtar"
              alt="Profile"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Account;
