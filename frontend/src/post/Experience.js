import React, { useEffect, useState } from "react";
import profile from "../profile.png";

function Experience({ postId }) {
  const [image, setImage] = useState(null);
  const token = sessionStorage.getItem("token");
  const [experience, setExperience] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/getexp/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setExperience(data.experienceImages);
      });
  }, [postId, token]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type! Please upload a JPG, JPEG, or PNG image.");
        e.target.value = "";
        return;
      }
      setImage(file);
    }
  };

  const handleExperienceClick = (exp) => {
    setSelectedExperience({ exp });
  };

  const closeExperienceModal = () => {
    setSelectedExperience(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please select an image first.");

    const formData = new FormData();
    formData.append("imageUrl", image);

    try {
      const res = await fetch(`http://localhost:8000/experience/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setExperience(data.experienceImages);
      if (data.error) {
        console.error("Upload failed:", data.error);
        return;
      }

      alert("Image uploaded successfully!");
      setImage(null);
    } catch (error) {
      console.error("Error uploading experience image:", error);
    }
  };

  return (
    <>
      <div className="image-grid">
        {experience?.map((exp, index) => (
          <div key={index} className="image-container">
            <img
              src={`http://localhost:8000/${exp.imageUrl}`}
              alt="experience"
              className="image2"
              onClick={() => handleExperienceClick(exp)}
            />
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ width: "auto", marginTop: "10px" }}
      >
        <label htmlFor="file-upload">Choose Image</label>
        <input
          type="file"
          id="file-upload"
          accept="image/png, image/jpeg, image/jpg"
          name="image"
          onChange={handleImageChange}
          required
        />
        <button type="submit">Add Experience</button>
      </form>

      {selectedExperience && (
        <div className="modal" onClick={closeExperienceModal}>
          <div className="modal-content">
            <span onClick={closeExperienceModal} style={{ cursor: "pointer" }}>
              &times;
            </span>
            <div style={{ display: "flex" }}>
              <img
                src={
                  selectedExperience.exp?.userId.profile
                    ? `http://localhost:8000/${selectedExperience.exp.userId.profile}`
                    : profile
                }
                alt="profile"
                className="profile-pic"
              />
              <h4>{selectedExperience.exp?.userId.name || "Unknown User"}</h4>
            </div>
            <img
              src={`http://localhost:8000/${selectedExperience.exp.imageUrl}`}
              alt="Full size"
              className="modal-image"
            />
            <p>
              Uploaded At:{" "}
              {selectedExperience.exp.uploadedAt
                ? new Date(selectedExperience.exp.uploadedAt).toLocaleString()
                : "Unknown Date"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Experience;
