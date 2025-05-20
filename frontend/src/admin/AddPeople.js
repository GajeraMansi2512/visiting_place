import { useState } from "react";
import "../css/index.css";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./adminHeader";

export default function AddPeople() {
  const [user, setUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "",
  });
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("email", user.email);
    formData.append("password", user.password);
    formData.append("name", user.name);
    formData.append("role", user.role);
    formData.append("profile", profile);

    fetch("http://localhost:8000/addPeople", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => navigate("/dashboard"));
  };

  const getUser = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <>
      <AdminHeader />
      <form onSubmit={handleSubmit}>
        <h2 style={{ textAlign: "center" }}>Add User</h2>

        <input
          type="email"
          name="email"
          onChange={getUser}
          placeholder="email"
          required
        />
        <input
          type="password"
          name="password"
          onChange={getUser}
          placeholder="password"
          required
        />
        <input
          type="text"
          name="name"
          onChange={getUser}
          placeholder="Name"
          required
        />
        <input
          type="file"
          name="profile"
          placeholder="add image"
          onChange={(e) => setProfile(e.target.files[0])}
          required
        />
        <select name="role" onChange={getUser} required>
          <option value="">Select Role</option>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
        <button type="submit">Add</button>
      </form>
    </>
  );
}
