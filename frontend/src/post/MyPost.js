import React from "react";
import Header from "../header";
import ViewPost from "./viewPost";

function MyPost() {
  return (
    <>
      <Header />
      <h2 className="h2">My Posts</h2>
      <ViewPost />
    </>
  );
}

export default MyPost;
