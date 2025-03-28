/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";
import { notificationSocket } from "../socket.io/socket";
import styles from "./Notifications.module.css";
import { useNavigate } from "react-router-dom";

const Notifications = ({ currentUserId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 11;
  const navigate = useNavigate();

  // 组件加载时获取初始通知数据
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await axios.get("http://localhost:3001/notifications", {
          withCredentials: true,
        });
        const notifs = res.data;
        setNotifications(notifs);
        const count = notifs.filter((n) => !n.isRead).length;
        setUnreadCount(count);
      } catch (error) {
        console.error("获取通知失败", error);
      }
    }
    fetchNotifications();
  }, []);
  const handleNewNotification = (newNotif) => {
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount(newNotif.unreadCount);
  };
  const handleReadNotifications = (newNotif) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif._id === newNotif._id ? newNotif : notif))
    );
    setUnreadCount(newNotif.unreadCount);
  };
  // 连接 Socket.IO 并注册当前用户
  useEffect(() => {
    // if (!currentUserId) return;
    // notificationSocket.emit("register", currentUserId);
    notificationSocket.on("newNotification", handleNewNotification);
    notificationSocket.on("notificationsRead", handleReadNotifications);

    return () => {
      notificationSocket.off("newNotification", handleNewNotification);
      notificationSocket.off("notificationsRead", handleReadNotifications);
    };
  }, [currentUserId]);

  // 分页计算：计算当前页需要显示的通知数据
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification =
    indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );

  // 分页控制
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (indexOfLastNotification < notifications.length)
      setCurrentPage(currentPage + 1);
  };

  // 单个通知点击，标记为已读
  const handleNotificationClick = async (notifId, notif) => {
    try {
      await axios.post(
        `http://localhost:3001/notifications/${notifId}/read`,
        {},
        { withCredentials: true }
      );
      // setNotifications((prev) =>
      //   prev.map((notif) =>
      //     notif._id === notifId ? { ...notif, isRead: true } : notif
      //   )
      // );
      // const newUnreadCount = notifications.filter(
      //   (notif) => notif._id !== notifId && !notif.isRead
      // ).length;
      // setUnreadCount(newUnreadCount);
      if (notif.postId) {
        navigate(`/postDetail/${notif.postUserName}/${notif.postId}`);
      }
    } catch (error) {
      console.error("标记通知为已读失败", error);
    }
  };

  // 一键标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    try {
      // 调用所有未读通知的接口
      await Promise.all(
        notifications
          .filter((notif) => !notif.isRead)
          .map((notif) =>
            axios.post(
              `http://localhost:3001/notifications/${notif._id}/read`,
              {},
              { withCredentials: true }
            )
          )
      );
      // 更新本地状态，将所有通知标记为已读
      // const updated = notifications.map((notif) => ({
      //   ...notif,
      //   isRead: true,
      // }));
      // setNotifications(updated);
      // setUnreadCount(0);
    } catch (error) {
      console.error("一键标记为已读失败", error);
    }
  };

  // 渲染单个通知项，右侧显示红点（如果未读）
  const renderNotificationItem = (notif) => {
    let icon;
    switch (notif.type) {
      case "like":
        icon = <i className="fi fi-sr-heart" style={{ color: "#e74c3c" }}></i>;
        break;
      case "comment":
        icon = (
          <i className="fi fi-sr-comment-alt" style={{ color: "#2ecc71" }}></i>
        );
        break;
      case "forward":
        icon = (
          <i className="fi fi-sr-paper-plane" style={{ color: "#3498db" }}></i>
        );
        break;
      case "system":
        icon = (
          <i className="fi fi-ss-settings" style={{ color: "#ffffe0" }}></i>
        );
        break;
      default:
        icon = <i className="fi fi-ss-bell" style={{ color: "#f19400" }}></i>;
    }

    return (
      <div
        key={notif._id}
        className={`${styles.notificationItem} ${
          notif.isRead ? styles.read : styles.unread
        }`}
        onClick={() => handleNotificationClick(notif._id, notif)}
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.content}>{notif.content}</span>
        <span className={styles.time}>
          {new Date(notif.createdAt).toLocaleString()}
        </span>
        {/* 红点显示在每个通知右侧 */}
        {!notif.isRead && <span className={styles.redDot} />}
      </div>
    );
  };

  return (
    <div className={styles.notificationContainer}>
      <div className={styles.notificationHeader}>
        <span className={styles.iconWrapper}>
          🔔
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </span>
        <span>通知</span>
        {/* 一键标记所有通知为已读按钮 */}
        <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
          一键已读
        </button>
      </div>
      <div className={styles.notificationList}>
        {notifications.length > 0 ? (
          currentNotifications.map((notif) => renderNotificationItem(notif))
        ) : (
          <p>暂无通知</p>
        )}
      </div>
      {/* 分页控制 */}
      {notifications.length > notificationsPerPage && (
        <div className={styles.pagination}>
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            上一页
          </button>
          <span>
            第 {currentPage} 页，共{" "}
            {Math.ceil(notifications.length / notificationsPerPage)} 页
          </span>
          <button
            onClick={handleNextPage}
            disabled={indexOfLastNotification >= notifications.length}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
