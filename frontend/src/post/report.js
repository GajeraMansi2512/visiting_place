import React, { useState } from "react";
import { BiShare } from "react-icons/bi";
import { CgShare } from "react-icons/cg";
import { MdBlock } from "react-icons/md";
import { useNavigate } from "react-router-dom";

function Report({ id, menuOpen, userId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();
  const user = sessionStorage.getItem("userId");
  const ReportPost = () => {
    if (!reason) {
      alert("Please enter a reason for reporting.");
      return;
    }
    fetch(`http://localhost:8000/report/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setReason("");
        setOpen(false);
      })
      .catch((err) => console.error("Error adding to favourites:", err));
  };

  return (
    <>
      {menuOpen === id && (
        <div className="menu-dropdown">
          {userId.userId?._id !== user && (
            <button
              className="link"
              onClick={() => setOpen(true)}
              style={{
                color: "red",
                display: "flex",
              }}
            >
              <MdBlock style={{ marginRight: "10px" }} /> Report
            </button>
          )}
          <button
            className="link"
            onClick={() => navigate("/sharepost", { state: { post: userId } })}
            style={{
              display: "flex",
            }}
          >
            <CgShare style={{ marginRight: "10px" }} /> Share
          </button>

          {open && (
            <div className="modal">
              <div className="modal-content">
                <input
                  type="text"
                  name="report"
                  placeholder="Enter Reson of report"
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: "300px" }}
                />
                <button
                  type="submit"
                  onClick={() => ReportPost()}
                  style={{ color: "gray" }}
                >
                  Report
                </button>
                <button
                  type="cancel"
                  onClick={() => setOpen(false)}
                  style={{ color: "gray" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Report;
