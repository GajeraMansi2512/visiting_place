import { Navigate, Outlet } from "react-router-dom";
import NotificationComponent from "./Notification";

const ProtectedRoute = () => {
  const token = sessionStorage.getItem("token");

  const isTokenExpired = () => {
    if (!token) return true;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  return token && !isTokenExpired() ? (
    <>
      <NotificationComponent />
      <Outlet />
    </>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
