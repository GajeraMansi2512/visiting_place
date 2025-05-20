// import React, { useEffect, useState } from "react";
// import AdminHeader from "./adminHeader";
// import "../css/index.css";

// function AdminData() {
//   const [user, setuser] = useState([]);
//   const [search, setSearch] = useState("");
//   const searchParam = search ? `&search=${search}` : "";
//   const token = sessionStorage.getItem("adminToken");

//   useEffect(() => {
//     const getuser = () => {
//       fetch(`http://localhost:8000/allAdmin?${searchParam}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//         .then((res) => res.json())
//         .then((data) => {
//           setuser(data);
//         });
//     };
//     getuser();
//   }, [token, searchParam]);

//   const handleSearch = (e) => {
//     setSearch(e.target.value);
//   };
//   return (
//     <div>
//       <AdminHeader />

//       <div>
//         <input
//           type="search"
//           name="search"
//           placeholder="Search User"
//           onChange={handleSearch}
//           className="input"
//         />
//         <table>
//           <thead>
//             <tr>
//               <th>No.</th>
//               <th>Email</th>
//               <th>Name</th>
//               <th>Password</th>
//               <th>Profile</th>
//             </tr>
//           </thead>
//           <tbody>
//             {user.length > 0 ? (
//               user.map((users, index) => (
//                 <tr key={index}>
//                   <td>{index + 1}</td>
//                   <td>{users.email}</td>
//                   <td>{users.name}</td>
//                   <td>{users.password}</td>
//                   <td>{users.profile}</td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td>No user</td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default AdminData;
