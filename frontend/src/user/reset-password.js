import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../header";

export default function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    fetch("http://localhost:8000/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, newPassword }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message === "Password reset successfully");
          setTimeout(() => {
            navigate("/login");
          }, 1000);
        } else {
          setMessage("Error occured...");
        }
      })
      .catch((err) => {
        setMessage("Error resetting password. Please try again.");
      });
  };

  return (
    <>
      <Header />
      <div>
        <h1>Reset Your Password</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Reset Password</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </>
  );
}
