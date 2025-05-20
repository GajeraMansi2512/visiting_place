import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header";
import "../css/index.css";

export default function Signup() {
  const [user, setUser] = useState({
    email: "",
    password: "",
    confirmpassword: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "signup successfull") {
          navigate("/login");
        } else {
          setError(data.message);
        }
      });
  };
  const getUser = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Header />
      <form onSubmit={handleSubmit} className="form">
        <h2 style={{ textAlign: "center" }}>Sign Up</h2>

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
          placeholder="passsword"
          required
        />
        <input
          type="password"
          name="confirmpassword"
          placeholder="confirm password"
          onChange={getUser}
          required
        />
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <button type="submit">signup</button>
      </form>
    </>
  );
}
