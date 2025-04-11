import SideBarstyles from "./SideBar.module.css";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { notificationSocket } from "./socket.io/socket";
import ThemeToggle from "./ThemeToggle";
import { ThemeContext } from "../context/ThemeContext";
// import { chatSocket } from "./socket.io/socket";

function SideBar() {
  const location = useLocation();
  const [userData, setUserData] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme } = useContext(ThemeContext);
  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true, // 确保发送 Cookie
      });
      setUserData(response.data);
    } catch (error) {
      console.error("获取用户失败:", error);
    }
  };

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/notifications/unReadCount",
        {
          withCredentials: true,
        }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("获取未读通知数失败:", error);
    }
  };

  const handleNewNotification = (unreadCount) => {
    setUnreadCount(unreadCount.unreadCount);
  };

  const handleNotificationsRead = (unreadCount) => {
    setUnreadCount(unreadCount.unreadCount);
  };

  useEffect(() => {
    fetchUser();
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   // 初始化时获取未读通知数
  //   fetchUnreadCount();
  //   // 每隔5秒触发一次fetchUnreadCount
  //   const interval = setInterval(fetchUnreadCount, 5000);
  //   // 清除定时器
  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    if (Object.keys(userData).length === 0) return;
    notificationSocket.emit("register", userData.id);
  }, [userData]);

  useEffect(() => {
    if (!notificationSocket.connected) return;
    notificationSocket.on("newNotification", handleNewNotification);
    notificationSocket.on("notificationsRead", handleNotificationsRead);
    return () => {
      notificationSocket.off("newNotification", handleNewNotification);
      notificationSocket.off("notificationsRead", handleNotificationsRead);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // useEffect(() => {
  //   if (!notificationSocket.connected) return;
  //   notificationSocket.on("notificationsRead", handleNotificationsRead);
  //   return () => {
  //     notificationSocket.off("notificationsRead", handleNotificationsRead);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // });

  return (
    <div
      className={
        theme === "dark" ? SideBarstyles.sidebar : SideBarstyles.sidebarLight
      }
    >
      <nav>
        <ul>
          <li>
            <Link to="/homepage">
              <i
                className={
                  location.pathname === "/homepage"
                    ? "fi fi-sr-home"
                    : "fi fi-br-home"
                }
              ></i>{" "}
              <span>首页</span>
            </Link>
          </li>
          <li>
            <Link to="/explore">
              <i
                className={
                  location.pathname.startsWith("/explore")
                    ? "fi fi-sr-search"
                    : "fi fi-br-search"
                }
              ></i>{" "}
              <span>搜索</span>
            </Link>
          </li>
          <li>
            <Link to="/notifications">
              <i
                className={
                  location.pathname === "/notifications"
                    ? "fi fi-sr-bell"
                    : "fi fi-br-bell"
                }
              ></i>{" "}
              <span>通知</span>{" "}
              {unreadCount > 0 && (
                <span className={SideBarstyles.redDot}></span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/messages">
              <i
                className={
                  location.pathname === "/messages"
                    ? "fi fi-sr-envelope"
                    : "fi fi-br-envelope"
                }
              ></i>{" "}
              <span>私信</span>
            </Link>
          </li>
          <li>
            <Link to="/bookmarks">
              <i
                className={
                  location.pathname === "/bookmarks"
                    ? "fi fi-sr-bookmark"
                    : "fi fi-br-bookmark"
                }
              ></i>{" "}
              <span>书签</span>
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <i
                className={
                  location.pathname === "/profile"
                    ? "fi fi-sr-user"
                    : "fi fi-br-user"
                }
              ></i>{" "}
              <span>个人资料</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className={SideBarstyles.bottomSection}>
        <ThemeToggle />
        <div className={SideBarstyles.profile}>
          <p>
            {userData.username}
            <br />
            {userData.email}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
