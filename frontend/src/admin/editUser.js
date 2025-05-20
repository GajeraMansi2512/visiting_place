import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminHeader from "../admin/adminHeader";

export default function EditUser() {
  const [user, setuser] = useState({
    email: "",
    password: "",
    name: "",
    mobile: "",
    profile: null,
  });
  const navigate = useNavigate();
  const [profile, setprofile] = useState(null);
  const { id } = useParams();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("email", user.email);
    formData.append("password", user.password);
    formData.append("name", user.name);
    formData.append("mobile", user.mobile);
    formData.append("profile", profile);

    fetch(`http://localhost:8000/admin/${id}/edit`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((user) => {
        navigate("/userdata");
        setprofile(null);
      });
  };

  useEffect(() => {
    const getuser = () => {
      fetch(`http://localhost:8000/${id}/userdata`, {})
        .then((res) => res.json())
        .then((data) => {
          setuser(data);
        });
    };
    getuser();
  }, [id]);

  const getuser = (e) => {
    setuser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <>
      <AdminHeader />

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="email"
          onChange={getuser}
          value={user.email}
          placeholder="email"
          required
        />
        <input
          type="password"
          name="password"
          onChange={getuser}
          value={user.password}
          placeholder="password"
          required
        />
        <input
          type="text"
          name="name"
          onChange={getuser}
          value={user.name}
          placeholder="name"
          required
        />
        <input
          type="number"
          name="mobile"
          value={user.mobile}
          placeholder="mobile"
          onChange={getuser}
          required
        />
        <input
          type="file"
          placeholder="profile"
          name="profile"
          onChange={(e) => setprofile(e.target.files[0])}
          required
        />

        <button type="submit">Edit user</button>
      </form>
    </>
  );
}
