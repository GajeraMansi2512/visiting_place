import React, { useEffect, useState } from "react";
import AdminHeader from "./adminHeader";
import { FaEdit } from "react-icons/fa";
import { FaDeleteLeft } from "react-icons/fa6";
import { Link } from "react-router-dom";
import "../css/index.css";

function UserData() {
  const [user, setuser] = useState([]);
  const [search, setSearch] = useState("");
  const searchParam = search ? `&search=${search}` : "";

  useEffect(() => {
    const getuser = () => {
      fetch(`http://localhost:8000/getuser?${searchParam}`)
        .then((res) => res.json())
        .then((data) => {
          setuser(data);
        });
    };
    getuser();
  }, [searchParam]);

  const deleteUser = (deleteId) => {
    fetch(`http://localhost:8000/user/${deleteId}/delete`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((user) =>
        setuser((prevuser) => prevuser.filter((item) => item._id !== deleteId))
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
          placeholder="Search User"
          onChange={handleSearch}
          className="input"
        />
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Email</th>
              <th>Name</th>
              <th>Password</th>
              <th>Mobile No.</th>
              <th>Profile</th>
              <th>Favourite</th>
              <th>Follow</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {user.length > 0 ? (
              user.map((users, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{users.email}</td>
                  <td>{users.name}</td>
                  <td>{users.password}</td>
                  <td>{users.mobile}</td>
                  <td>{users.profile}</td>
                  <td>
                    {users.favourite.map((fav, index) => (
                      <p key={index}>{fav.title}</p>
                    ))}
                  </td>
                  <td>
                    {users.follow.map((fav, index) => (
                      <p key={index}>{fav.name ? fav.name : "Unknown"}</p>
                    ))}
                  </td>
                  <td>
                    <Link to={`/admin/${users._id}/edit`}>
                      <FaEdit className="edit" />
                    </Link>
                  </td>
                  <td>
                    <FaDeleteLeft
                      className="delete"
                      onClick={() => deleteUser(users._id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td>No user</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserData;
