import React, { useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import Header from "../header";

function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const location = useLocation();
  const chatroomId = location.state?.chatroomId;
  const token = sessionStorage.getItem("token");

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/messages/search-chat",
        { chatroomId, query },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error", err);
    }
    setSearching(false);
  };

  return (
    <>
      <Header />
      <div className="chat-container">
        <div className="chat-header">
          Search Message
        </div>
        <div>
          <input
            type="text"
            placeholder="Search in chat..."
            value={searchTerm}
            onChange={handleSearch}
          />

          <div className="chat-messages">
            {(searchTerm ? searchResults : []).map((msg) => (
              <div key={msg._id} className="message">
                <strong>{msg.sender.name}</strong>: {msg.message}
                <br />
                <small>{new Date(msg.createdAt).toLocaleString()}</small>
              </div>
            ))}
            {searchTerm && searchResults.length === 0 && (
              <p>No matching messages</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchScreen;
