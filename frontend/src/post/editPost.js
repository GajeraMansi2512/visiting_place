// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import Header from "../header";

// export default function EditPost() {
//   const [post, setPost] = useState({
//     title: "",
//     image: null,
//     country: "",
//     category: "",
//     description: "",
//   });
//   const navigate = useNavigate();
//   const [image, setImage] = useState(null);
//   const token = sessionStorage.getItem("token");
//   const { id } = useParams();

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const formData = new FormData();

//     formData.append("title", post.title);
//     formData.append("description", post.description);
//     formData.append("country", post.country);
//     formData.append("category", post.category);
//     formData.append("image", image);

//     fetch(`http://localhost:8000/${id}/edit`, {
//       method: "POST",
//       body: formData,
//     })
//       .then((res) => res.json())
//       .then((post) => {
//         navigate("/viewpost");
//         setImage(null);
//       });
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];

//     if (file) {
//       const validTypes = ["image/jpeg", "image/png", "image/jpg"];
//       if (!validTypes.includes(file.type)) {
//         alert("Invalid file type! Please upload a JPG, JPEG, or PNG image.");
//         e.target.value = "";
//         return;
//       }
//       setImage(file);
//     }
//   };

//   useEffect(() => {
//     const getPost = () => {
//       fetch(`http://localhost:8000/${id}/detail`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//         .then((res) => res.json())
//         .then((data) => {
//           setPost(data.post);
//         });
//     };
//     getPost();
//   }, [token, id]);

//   const getPost = (e) => {
//     setPost({ ...post, [e.target.name]: e.target.value });
//   };

//   return (
//     <>
//       <Header />
//       <form onSubmit={handleSubmit}>
//         <h2>Edit Post</h2>
//         <input
//           type="text"
//           name="title"
//           onChange={getPost}
//           value={post.title}
//           placeholder="title"
//           required
//         />
//         <textarea
//           name="description"
//           onChange={getPost}
//           value={post.description}
//           placeholder="description"
//           required
//         />
//         <input
//           type="text"
//           name="country"
//           onChange={getPost}
//           value={post.country}
//           placeholder="country"
//           required
//         />
//         <input
//           type="text"
//           name="category"
//           value={post.category}
//           placeholder="category"
//           onChange={getPost}
//           required
//         />
//         <input
//           type="file"
//           placeholder="image"
//           accept="image/png, image/jpeg, image/jpg"
//           name="image"
//           onChange={handleImageChange}
//           required
//         />

//         <button type="submit">Edit Post</button>
//       </form>
//     </>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../header";

export default function EditPost() {
  const [post, setPost] = useState({
    title: "",
    image: "",
    moreImage: [],
    country: "",
    category: "",
    description: "",
    hashtags: [],
  });

  const navigate = useNavigate();
  const [newMainImage, setNewMainImage] = useState(null);
  const [newMoreImages, setNewMoreImages] = useState([]);
  const token = sessionStorage.getItem("token");
  const { id } = useParams();
  const [newHashtag, setNewHashtag] = useState("");
  const suggestedHashtags = [
    "#travel",
    "#adventure",
    "#nature",
    "#explore",
    "#vacation",
    "#wanderlust",
    "#beach",
    "#hiking",
    "#culture",
  ];

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

  const handleNewHashtagChange = (e) => {
    setNewHashtag(e.target.value);
  };

  const addNewHashtag = () => {
    if (!newHashtag.trim()) return;

    const formattedHashtag = newHashtag.startsWith("#")
      ? newHashtag.trim()
      : `#${newHashtag.trim()}`;

    if (!post.hashtags.includes(formattedHashtag)) {
      setPost((prevPost) => ({
        ...prevPost,
        hashtags: [...prevPost.hashtags, formattedHashtag],
      }));
    }

    setNewHashtag("");
  };

  useEffect(() => {
    const getPost = async () => {
      const res = await fetch(`http://localhost:8000/${id}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPost(data.post);
    };
    getPost();
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("title", post.title);
    formData.append("description", post.description);
    formData.append("country", post.country);
    formData.append("category", post.category);
    formData.append("hashtags", JSON.stringify(post.hashtags));
    if (newMainImage) {
      formData.append("image", newMainImage);
    }

    newMoreImages.forEach((image) => {
      formData.append("moreImage", image);
    });

    await fetch(`http://localhost:8000/${id}/edit`, {
      method: "POST",
      body: formData,
    });

    navigate("/viewpost");
  };

  const handleMainImageChange = (e) => {
    setNewMainImage(e.target.files[0]);
  };

  const handleMoreImagesChange = (e) => {
    setNewMoreImages([...newMoreImages, ...Array.from(e.target.files)]);
  };

  const getPost = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Header />
      <form onSubmit={handleSubmit} className="form">
        <h3>Edit Post</h3>

        <input
          type="text"
          name="title"
          onChange={getPost}
          value={post.title}
          placeholder="Title"
          required
        />
        <textarea
          name="description"
          onChange={getPost}
          value={post.description}
          placeholder="Description"
          required
        />
        <input
          type="text"
          name="country"
          onChange={getPost}
          value={post.country}
          placeholder="Country"
          required
        />
        <input
          type="text"
          name="category"
          value={post.category}
          placeholder="Category"
          onChange={getPost}
          required
        />

        {post.image && (
          <div>
            <p>Current Main Image:</p>
            <img
              src={`http://localhost:8000/${post.image}`}
              alt="Main"
              className="imagepreview"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          onChange={handleMainImageChange}
        />

        <div>
          <p>Current More Images:</p>
          {post.moreImage.map((img, index) => (
            <img
              key={index}
              src={`http://localhost:8000/${img}`}
              alt="More"
              className="imagepreview"
            />
          ))}
        </div>

        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          multiple
          onChange={handleMoreImagesChange}
        />

        <h4>Suggested Hashtags</h4>
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
                background: post.hashtags.includes(tag) ? "#FF6347" : "#f0f0f0",
                color: post.hashtags.includes(tag) ? "#fff" : "#333",
                cursor: "pointer",
              }}
            >
              {tag} {post.hashtags.includes(tag) ? "❌" : ""}
            </button>
          ))}
        </div>

        <h4>Add New Hashtag</h4>
        <div style={{ display: "flex" }}>
          <input
            type="text"
            value={newHashtag}
            onChange={handleNewHashtagChange}
            placeholder="Type new hashtag"
          />
          <button type="button" onClick={addNewHashtag}>
            Add
          </button>
        </div>

        <h4>Selected Hashtags</h4>
        <div>
          {post.hashtags.map((tag, index) => (
            <span
              key={index}
              onClick={() => toggleHashtag(tag)}
              style={{
                margin: "5px",
                padding: "5px 10px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                background: "#FF6347",
                color: "#fff",
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              {tag} ❌
            </span>
          ))}
        </div>

        <button type="submit">Edit Post</button>
      </form>
    </>
  );
}
