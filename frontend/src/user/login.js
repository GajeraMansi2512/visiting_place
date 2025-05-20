import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../header";

export default function Login() {
  const [user, setUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const loginType = sessionStorage.getItem("login");

  const handleSubmit = (e) => {
    e.preventDefault();

    // if (loginType === "login") {
    fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
      .then((res) => res.json())
      .then((user) => {
        if (user.errors) {
          alert(user.errors);
        }
        if (user.message === "login successful") {
          sessionStorage.setItem("token", user.token);
          sessionStorage.setItem("profile", user.user.profile);
          sessionStorage.setItem("userId", user.user._id);

          navigate("/home");
        }
        if (!user.errors && user.message !== "login successful") {
          alert(user.message);
        }
      })
      .catch((err) => console.log(err));
    // }

    // if (loginType === "admin-login") {
    //   fetch("http://localhost:8000/admin-login", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(user),
    //   })
    //     .then((res) => res.json())
    //     .then((user) => {
    //       if (user.message === "login successful") {
    //         sessionStorage.setItem("adminToken", user.token);
    //         sessionStorage.setItem("name", user.name);
    //         sessionStorage.setItem("profile", user.profile);

    //         alert("login successful");
    //         navigate("/dashboard");
    //       } else {
    //         alert(user.message);
    //       }
    //     })
    //     .catch((err) => console.log(err));
    // }
  };

  const getUser = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Header />

      <form onSubmit={handleSubmit} className="form">
        <h2 style={{ textAlign: "center" }}>
          Login
          {/* {loginType === "login" ? "User Login" : "Admin Login"} */}
        </h2>
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

        <button type="submit">login</button>
        <br></br>
        {/* {loginType === "login" ? ( */}
        <Link to="/forgot-password">Forgot passsword ?</Link>
        {/* ) : (
          ""
        )} */}
      </form>
    </>
  );
}
