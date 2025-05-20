import React, { useEffect, useState } from "react";
import socket from "./socket";

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const userId = sessionStorage.getItem("userId");

  const fetchNotifications = async () => {
    try {
      setNotifications([]);
      const response = await fetch(
        `http://localhost:8000/notifications/${userId}`
      );
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    socket.emit("register", userId);
    socket.emit("fetchNotifications", userId);
    socket.on("notifications", (data) => {
      if (data.type === "bulk") {
        setNotifications(data.data);
      } else if (data.type === "single") {
        setNotifications((prev) => [data.data, ...prev]);
      }
    });

    return () => {
      socket.off("notifications");
    };
  }, [userId]);

  const handleNotificationClick = async (id) => {
    try {
      await fetch(`http://localhost:8000/notifications/read/${id}`, {
        method: "PATCH",
      });

      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="notification-container">
      {notifications.length > 0
        ? notifications.map((notif) => (
            <div
              key={notif._id}
              className="notification"
              onClick={() => handleNotificationClick(notif._id)}
            >
              {notif.message}
            </div>
          ))
        : ""}
    </div>
  );
};

export default NotificationComponent;
