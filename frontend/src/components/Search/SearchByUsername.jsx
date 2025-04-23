/* eslint-disable react/prop-types */
import styles from "./SearchByUsername.module.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

function SearchByUsername({ users = [] }) {
  const [profileData, setProfileData] = useState({});
  const [followStatus, setFollowStatus] = useState({});
  const { theme } = useContext(ThemeContext);

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true,
      });
      setProfileData({
        username: response.data.username,
        avatar: response.data.avatar,
        email: response.data.email,
        createdAt: response.data.createdAt,
        sign: response.data.sign,
        userId: response.data.id,
      });
    } catch (error) {
      console.error("获取用户失败:", error);
    }
  };

  const queryIsFollow = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/follow/isFollowed/${userId}`,
        {
          withCredentials: true,
        }
      );
      setFollowStatus((prev) => ({
        ...prev,
        [userId]: response.data.isFollowed,
      }));
    } catch (error) {
      console.error("获取用户关注状态失败:", error);
    }
  };

  const addFollow = async (userId) => {
    setFollowStatus((prev) => ({ ...prev, [userId]: true }));
    try {
      await axios.post(
        "http://localhost:3001/follow/addFollow",
        { userId },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("关注用户失败:", error);
      setFollowStatus((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const removeFollow = async (userId) => {
    setFollowStatus((prev) => ({ ...prev, [userId]: false }));
    try {
      await axios.post(
        "http://localhost:3001/follow/removeFollow",
        { userId },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("取消关注用户失败:", error);
      setFollowStatus((prev) => ({ ...prev, [userId]: true }));
    }
  };

  const toggleFollow = async (userId) => {
    if (!followStatus[userId]) {
      await addFollow(userId);
    } else {
      await removeFollow(userId);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (Array.isArray(users) && profileData.userId) {
      users.forEach((user) => {
        if (user._id !== profileData.userId) {
          queryIsFollow(user._id);
        }
      });
    }
  }, [users, profileData.userId]);

  return (
    <>
      {Array.isArray(users) && (
        <div
          className={
            theme === "dark" ? styles.container : styles.containerLight
          }
        >
          {users.map((user) => (
            <div
              key={user._id}
              className={
                theme === "dark" ? styles.userCard : styles.userCardLight
              }
            >
              <div className={styles.userInfo}>
                <p
                  className={
                    theme === "dark" ? styles.username : styles.usernameLight
                  }
                >
                  {user.username}
                </p>
                <p
                  className={
                    theme === "dark" ? styles.email : styles.emailLight
                  }
                >
                  {user.email}
                </p>
              </div>
              <div className={styles.buttonGroup}>
                {profileData.userId !== user._id && (
                  <button
                    className={
                      theme === "dark" ? styles.button : styles.buttonLight
                    }
                    onClick={() => toggleFollow(user._id)}
                  >
                    {followStatus[user._id] ? "已关注" : "关注"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default SearchByUsername;
