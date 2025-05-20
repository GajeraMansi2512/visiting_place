import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function AdminEditpost() {
  const [post, setPost] = useState({
    title: "",
    image: null,
    country: "",
    category: "",
    description: "",
  });
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const { id } = useParams();
  const token = sessionStorage.getItem("adminToken");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("title", post.title);
    formData.append("description", post.description);
    formData.append("country", post.country);
    formData.append("category", post.category);
    formData.append("image", image);

    fetch(`http://localhost:8000/admin/post/${id}/edit`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((post) => {
        navigate("/postdata");
        setImage(null);
      });
  };

  useEffect(() => {
    const getPost = () => {
      fetch(`http://localhost:8000/admin/post/${id}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setPost(data.post));
    };
    getPost();
  }, [token, id]);

  const getPost = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          onChange={getPost}
          value={post.title}
          placeholder="title"
          required
        />
        <textarea
          name="description"
          onChange={getPost}
          value={post.description}
          placeholder="description"
          required
        />
        <input
          type="text"
          name="country"
          onChange={getPost}
          value={post.country}
          placeholder="country"
          required
        />
        <input
          type="text"
          name="category"
          value={post.category}
          placeholder="category"
          onChange={getPost}
          required
        />
        <input
          type="file"
          placeholder="image"
          name="image"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />

        <button type="submit">Edit Post</button>
      </form>
    </>
  );
}
