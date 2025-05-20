import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import Signup from "./user/signup";
import Login from "./user/login";
import AddPost from "./post/postAdd";
import EditPost from "./post/editPost";
import AllPost from "./post/allPost";
import DetailPost from "./post/detailPost";
import FavouritePost from "./post/favouritePost";
import ForgotPassword from "./user/forgotpassword";
import ResetPassword from "./user/reset-password";
import Profile from "./user/profile";
import Category from "./category/Category";
import Country from "./category/Country";
import UserData from "./admin/UserData";
import PostData from "./admin/PostData";
import AdminHeader from "./admin/adminHeader";
import Dashboard from "./admin/Dashboard";
import EditUser from "./admin/editUser";
import ReviewData from "./admin/ReviewData";
import AddPeople from "./admin/AddPeople";
import AllUser from "./user/AllUser";
import Account from "./user/Account";
import MyFeed from "./post/MyFeed";
import AdminEditpost from "./admin/editPost";
import MyPost from "./post/MyPost";
import TrendingPost from "./post/TrendingPost";
import MyProfile from "./user/MyProfile";
import Home from "./Home";
import CategoryName from "./category/categoryname";
import { ThemeProvider } from "./ThemeContext";
import HashtagPosts from "./post/Hashtag";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationComponent from "./Notification";
import MessageList from "./message/MessageList";
import DirectChat from "./message/DirectChat";
import ChatRoom from "./message/chatRoom";
import SharePost from "./post/sharePost";
import ArchivePost from "./post/ArchivePost";
import ArchiveChat from "./message/ArchiveChat";
import MediaGallery from "./message/MediaGallery";
import SearchSecreen from "./message/searchSecreen";
import LocationSearchPicker from "./message/locationshareing";
import CreatePoll from "./message/Poll";

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
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Signup />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/addpost", element: <AddPost /> },
      { path: "/viewpost", element: <MyPost /> },
      { path: "/allpost", element: <AllPost /> },
      { path: "/:id/detail", element: <DetailPost /> },
      { path: "/favourite", element: <FavouritePost /> },
      { path: "/profile", element: <MyProfile /> },
      { path: "/editprofile", element: <Profile /> },
      { path: "/category", element: <Category /> },
      { path: "/:country/post", element: <Country /> },
      { path: "/:id/edit", element: <EditPost /> },
      { path: "/:id/account", element: <Account /> },
      { path: "/alluser", element: <AllUser /> },
      { path: "/feed", element: <MyFeed /> },
      { path: "/trending", element: <TrendingPost /> },
      { path: "/home", element: <Home /> },
      { path: "/posts/:category", element: <CategoryName /> },
      { path: "/hashtag/:tag", element: <HashtagPosts /> },
      { path: "/message", element: <ChatRoom /> },
      { path: "/personal", element: <MessageList /> },
      { path: "/sharepost", element: <SharePost /> },
      { path: "/archive", element: <ArchivePost /> },
      { path: "/archiveuser", element: <ArchiveChat /> },
      { path: "/mediagallery", element: <MediaGallery /> },
      { path: "/searchmessage", element: <SearchSecreen /> },
      { path: "/location", element: <LocationSearchPicker /> },
      { path: "/poll", element: <CreatePoll /> },

      {
        path: "/:user/:receiverid",
        element: <DirectChat />,
      },
    ],
  },

  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },
  { path: "/userdata", element: <UserData /> },
  { path: "/postdata", element: <PostData /> },
  { path: "/admin-header", element: <AdminHeader /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/admin/:id/edit", element: <EditUser /> },
  { path: "/admin/review", element: <ReviewData /> },
  { path: "/admin/post/:id/edit", element: <AdminEditpost /> },
  { path: "/addPeople", element: <AddPeople /> },
  // { path: "/adminData", element: <AdminData /> },

  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

function App() {
  return (
    <ThemeProvider>
      <NotificationComponent />
      <ToastContainer />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
