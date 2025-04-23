import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import Homepage from "./pages/Homepage.jsx";
import Explore from "./pages/Explore.jsx";
import Notifications from "./pages/Notifications.jsx";
import Messages from "./pages/Messages.jsx";
import BookMarks from "./pages/BookMarks.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import PostsDetail from "./pages/PostsDetail.jsx";
import SideBar from "./components/SideBar.jsx";
import AIPartBar from "./components/AIPartBar.jsx";
import styles from "./pages/TotalLayout.module.css";
import SearchResults from "./pages/SearchResults.jsx";
import { ThemeContext } from "./context/ThemeContext"; // 导入 ThemeProvider
import Admin from "./components/Admin/Admin.jsx";
import AdminRoute from "./AdminRoute.jsx";
function App() {
  const { theme } = useContext(ThemeContext);
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页面 */}
        <Route index element={<Login />} />
        {/* 私有路由，登录后访问 */}
        <Route
          path="/*"
          element={
            <div
              className={
                theme === "dark"
                  ? styles.pageContainer
                  : styles.pageContainerLight
              }
            >
              <SideBar />
              <div className={styles.mainContainer}>
                <Routes>
                  <Route
                    path="homepage"
                    index
                    element={
                      <PrivateRoute>
                        <Homepage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="explore"
                    element={
                      <PrivateRoute>
                        <Explore />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="explore/search/:type"
                    element={
                      <PrivateRoute>
                        <SearchResults />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="notifications"
                    element={
                      <PrivateRoute>
                        <Notifications />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="messages"
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="bookmarks"
                    element={
                      <PrivateRoute>
                        <BookMarks />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="postDetail/:name/:postId"
                    element={
                      <PrivateRoute>
                        <PostsDetail />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <AdminRoute>
                        <Admin />
                      </AdminRoute>
                    }
                  />

                  {/* 404 路由 */}
                  <Route
                    path="*"
                    element={
                      <div
                        style={{
                          color: "white",
                          justifyContent: "center",
                          alignItems: "center",
                          display: "flex",
                          height: "100vh",
                        }}
                      >
                        未找到相关内容
                      </div>
                    }
                  />
                </Routes>
              </div>
              <AIPartBar />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
