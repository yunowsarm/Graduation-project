/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { useState, useEffect } from "react";
import styles from "./UserCard.module.css";
import { useNavigate } from "react-router-dom";
function UserCard({ userId, email, userName, avatar }) {
  const [isFollow, setIsFollow] = useState(null);
  const [isOwn, setIsOwn] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    queryIsFollow();
  }, []);

  const formatNumber = (num) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "w";
    }
    return num;
  };

  const queryIsFollow = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/follow/isFollowed/${userId}`,
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
      console.log(response.data);
      setIsFollow(response.data.isFollowed);
      if (response.data.currentUserId === userId) {
        setIsOwn(true);
      }
    } catch (error) {
      console.error("获取用户关注状态失败:", error);
    }
  };

  const addFollow = async () => {
    // 乐观更新：先更新状态，让按钮立刻显示已关注
    setIsFollow(true);
    try {
      await axios.post(
        `http://localhost:3001/follow/addFollow`,
        { userId },
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
    } catch (error) {
      // 请求失败时，回退状态
      console.error("关注用户失败:", error);
      setIsFollow(false);
    }
  };

  const removeFollow = async () => {
    setIsFollow(false);
    try {
      await axios.post(
        `http://localhost:3001/follow/removeFollow`,
        { userId },
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
    } catch (error) {
      console.error("取消关注用户失败:", error);
      setIsFollow(true);
    }
  };

  const toggleFollow = async () => {
    // 调用关注/取消关注的 API
    if (!isFollow) {
      await addFollow();
    } else {
      await removeFollow();
    }
  };

  const sendMessage = async () => {
    try {
      await axios.post(
        `http://localhost:3001/conversations`,
        { receiverId: userId },
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
      navigate("/messages");
    } catch {
      console.log("发送消息失败");
    }
  };

  return (
    <>
      <div className={styles.tooltipHeader}>
        <img src={avatar} className={styles.tooltipAvatar} />
        <div className={styles.tooltipInfo}>
          <strong className={styles.tooltipUserName}>
            {userName || "未提供"}
          </strong>
          <strong className={styles.tooltipEmail}>{email || "未提供"}</strong>
          {/* 新增统计数据区域 */}
          <div className={styles.tooltipStats}>
            <span className={styles.statItem}>{formatNumber(9000)} 关注</span>
            <span className={styles.statItem}>{formatNumber(129000)} 粉丝</span>
            <span className={styles.statItem}>{formatNumber(19000)} 帖子</span>
          </div>
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <span
          className={`${!isOwn && styles.followButton} ${
            !isOwn && (isFollow ? styles.followed : "")
          }`}
          onClick={toggleFollow}
        >
          {!isOwn && (isFollow ? "已关注" : "+ 关注")}
        </span>
        <span
          className={`${!isOwn && styles.messageButton}`}
          onClick={sendMessage}
        >
          {!isOwn && "发信息"}
        </span>
      </div>
    </>
  );
}

export default UserCard;
