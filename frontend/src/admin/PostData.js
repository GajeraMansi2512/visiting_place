import React, { useEffect, useState } from "react";
import AdminHeader from "./adminHeader";
import { FaDeleteLeft } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../css/index.css";

function PostData() {
  const [post, setpost] = useState([]);
  const [search, setSearch] = useState("");
  const searchParam = search ? `&search=${search}` : "";

  useEffect(() => {
    const getpost = () => {
      fetch(`http://localhost:8000/postdata?${searchParam}`)
        .then((res) => res.json())
        .then((data) => {
          setpost(data);
        });
    };

    getpost();
  }, [searchParam]);

  const deletePost = (deleteId) => {
    fetch(`http://localhost:8000/admin/${deleteId}/delete`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((post) =>
        setpost((prevPost) => prevPost.filter((item) => item._id !== deleteId))
      );
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  return (
    <div>
      <AdminHeader />
      <div>
        <input
          type="search"
          name="search"
          placeholder="search post"
          onChange={handleSearch}
          className="input"
        />
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Title</th>
              <th>Description</th>
              <th>Image</th>
              <th>Country</th>
              <th>Category</th>
              <th>Added By</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {post.map((posts, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{posts.title}</td>
                <td className="description-container">{posts.description}</td>
                <td>{posts.image}</td>
                <td>{posts.country}</td>
                <td>{posts.category}</td>
                <td>
                  {posts.userId.name}({posts.userId.email})
                </td>
                <td>
                  <Link to={`/admin/post/${posts._id}/edit`}>
                    <FaEdit className="edit" />
                  </Link>
                </td>
                <td>
                  <FaDeleteLeft
                    className="delete"
                    onClick={() => deletePost(posts._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PostData;
