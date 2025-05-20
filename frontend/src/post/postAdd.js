import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header";

export default function AddPost() {
  const [post, setPost] = useState({
    title: "",
    description: "",
    country: "",
    category: "",
    hashtags: [],
  });
  const [customHashtag, setCustomHashtag] = useState("");
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const token = sessionStorage.getItem("token");
  const suggestedHashtags = [
    "#travel",
    "#adventure",
    "#nature",
    "#explore",
    "#vacation",
    "#beach",
    "#hiking",
    "#summerplace",
  ];
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("title", post.title);
    formData.append("description", post.description);
    formData.append("country", post.country);
    formData.append("category", post.category);
    formData.append("hashtags", post.hashtags.join(","));
    formData.append("image", image);

    fetch("http://localhost:8000/addpost", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
      .then((res) => res.json())
      .then((post) => {
        setPost({
          title: "",
          description: "",
          country: "",
          category: "",
          hashtags: [],
        });
        navigate("/viewpost");
        setImage(null);
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
      setImage(file);
    }
  };

  const getPost = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  const handleCustomHashtag = (e) => {
    setCustomHashtag(e.target.value);
  };

  const addCustomHashtag = () => {
    if (customHashtag.trim() && !post.hashtags.includes(customHashtag)) {
      setPost({ ...post, hashtags: [...post.hashtags, customHashtag.trim()] });
      setCustomHashtag("");
    }
  };

  const toggleHashtag = (tag) => {
    if (post.hashtags.includes(tag)) {
      setPost({
        ...post,
        hashtags: post.hashtags.filter((hashtag) => hashtag !== tag),
      });
    } else {
      setPost({ ...post, hashtags: [...post.hashtags, tag] });
    }
  };

  return (
    <>
      <Header />
      <form onSubmit={handleSubmit} className="form">
        <h2>Add Post</h2>
        <input
          type="text"
          name="title"
          onChange={getPost}
          placeholder="Place Name"
          required
        />
        <textarea
          name="description"
          onChange={getPost}
          placeholder="Description"
          required
        />
        <input
          type="text"
          name="country"
          onChange={getPost}
          placeholder="Country"
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          onChange={getPost}
          required
        />
        <input
          type="file"
          placeholder="image"
          accept="image/png, image/jpeg, image/jpg"
          name="image"
          onChange={handleImageChange}
          required
        />
        <h4>Add Hashtags</h4>
        <div>
          {suggestedHashtags.map((tag, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleHashtag(tag)}
              style={{
                margin: "5px",
                padding: "5px 10px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                background: post.hashtags.includes(tag) ? "green" : "#f0f0f0",
                color: post.hashtags.includes(tag) ? "#fff" : "#333",
                cursor: "pointer",
              }}
            >
              {tag} {post.hashtags.includes(tag) ? "❌" : ""}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Eg. Best Time to visit, Things to do..."
          value={customHashtag}
          onChange={handleCustomHashtag}
        />
        <button type="button" onClick={addCustomHashtag}>
          Add
        </button>

        <div>
          <h4>Selected Hashtags</h4>
          {post.hashtags.map((tag, index) => (
            <span
              key={index}
              onClick={() => toggleHashtag(tag)}
              style={{
                margin: "5px",
                padding: "5px 10px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                color: "black",
                backgroundColor: "white",
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              {tag} ❌
            </span>
          ))}
        </div>

        <button type="submit">Add Post</button>
      </form>
    </>
  );
}
