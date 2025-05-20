import { useState } from "react";
import socket from "../socket";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../header";

const CreatePoll = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = sessionStorage.getItem("userId");

  const chatRoomId = location.state?.chatroomId;
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || options.some((opt) => !opt.trim())) {
      alert("Please enter a question and all options.");
      return;
    }
    if (!chatRoomId) {
      alert("Chat room ID is missing.");
      return;
    }

    socket.emit("createPoll", { chatRoomId, question, options, userId });
    setQuestion("");
    setOptions(["", ""]);
    navigate(-1);
  };

  return (
    <>
      <Header />
      <div className="chat-container">
        <div className="chat-header">Create a Poll</div>
        <div className="chat-messages">
          <input
            type="text"
            placeholder="Poll question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          {options.map((option, idx) => (
            <div key={idx}>
              <input
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
              />
              {options.length > 2 && (
                <button type="cancle" onClick={() => removeOption(idx)}>
                  ❌
                </button>
              )}
            </div>
          ))}
          {options.length < 5 && (
            <button onClick={addOption}>➕ Add Option</button>
          )}
          <br />
          <button onClick={handleSubmit}>Send Poll</button>
        </div>
      </div>
    </>
  );
};

export default CreatePoll;
