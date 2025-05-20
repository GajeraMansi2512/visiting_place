import { useState } from "react";
import Header from "../header";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleClick = (e) => {
    e.preventDefault();

    fetch(`http://localhost:8000/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Link sent successful") {
          alert(data.message);
        } else {
          alert(data.message);
        }
      });
  };

  return (
    <>
      <Header />
      <form onSubmit={handleClick}>
        <h2>Forgot Password</h2>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">send reset link</button>
      </form>
    </>
  );
}
