import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header";

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    mobile: "",
    profile: null,
  });
  const token = sessionStorage.getItem("token");
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const getUser = (e) => {
    const { name, value } = e.target;
    setUser((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUser = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", user.name);
    formData.append("mobile", user.mobile);
    formData.append("profile", profile);
    fetch("http://localhost:8000/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        navigate("/profile");
        sessionStorage.setItem("profile", data.profile);
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type! Please upload a JPG, JPEG, or PNG image.");
        e.target.value = "";
        return;
      }
      setProfile(file);
    }
  };

  useEffect(() => {
    const getUser = () => {
      fetch("http://localhost:8000/viewprofile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser((prevUser) => ({
            ...prevUser,
            ...data.user,
          }));
        });
    };
    getUser();
  }, [token]);

  return (
    <>
      <Header />
      <form onSubmit={handleUser} className="form">
        <h2>Edit Profile</h2>
        <input
          type="text"
          value={user.name}
          name="name"
          onChange={getUser}
          placeholder="name"
        />
        <input
          type="number"
          value={user.mobile}
          name="mobile"
          onChange={getUser}
          placeholder="mobile"
        />
        <input
          type="file"
          name="profile"
          value={user.image}
          placeholder="image"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
