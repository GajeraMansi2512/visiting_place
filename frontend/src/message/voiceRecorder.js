import React, { useState, useRef } from "react";
import socket from "../socket";
import { BiMicrophone, BiStopCircle } from "react-icons/bi";

import { CgMic } from "react-icons/cg";
import { MdMic } from "react-icons/md";

const VoiceRecorder = ({ senderId, receiverId, option }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const chatroomId = [senderId, receiverId].sort().join("_");

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      const audioFile = new File([audioBlob], "voice-message.wav", {
        type: "audio/wav",
      });

      const formData = new FormData();
      formData.append("audio", audioFile);

      try {
        const response = await fetch(
          "http://localhost:8000/messages/upload/voice",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        if (data.success) {
          const voiceFileUrl = data.url;

          const audioURL = URL.createObjectURL(audioBlob);
          const audioElement = new Audio(audioURL);

          audioElement.onloadedmetadata = () => {
            const audioDuration = audioElement.duration;

            socket.emit("sendVoiceMessage", {
              senderId,
              chatroomId: option === "chatroom" ? receiverId : chatroomId,
              voiceFileUrl,
              voiceDuration: audioDuration.toFixed(2),
            });
          };
        } else {
          console.error("Upload failed:", data.message);
        }
      } catch (error) {
        console.error("Error uploading voice message:", error);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div style={{ marginTop: "22px", marginLeft: "10px" }}>
      {isRecording ? (
        <div onClick={stopRecording}>
          <BiStopCircle color="red" size={18} />
        </div>
      ) : (
        <div onClick={startRecording}>
          <BiMicrophone
            size={15}
            style={{ cursor: "pointer" }}
            title="voice message"
          />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
