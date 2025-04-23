/* eslint-disable react/prop-types */
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import styles from "./SearchByEmail.module.css";
import { ThemeContext } from "../../context/ThemeContext";
function SearchByEmail({ email= [] }) {
  const [isFollow, setIsFollow] = useState(null);
  const [profileData, setProfileData] = useState({});
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

  const queryIsFollow = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/follow/isFollowed/${email._id}`,
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
      setIsFollow(response.data.isFollowed);
    } catch (error) {
      console.error("获取用户关注状态失败:", error);
    }
  };

  const addFollow = async () => {
    // 先更新状态，让按钮立刻显示已关注
    setIsFollow(true);
    try {
      await axios.post(
        `http://localhost:3001/follow/addFollow`,
        { userId: email._id },
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
        { userId: email._id },
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

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    queryIsFollow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email._id]);

  return (
    <>
      {email && (
        <div
          className={
            theme === "dark" ? styles.container : styles.containerLight
          }
        >
          <div
            className={
              theme === "dark" ? styles.userCard : styles.userCardLight
            }
          >
            <div
              className={
                theme === "dark" ? styles.userInfo : styles.userInfoLight
              }
            >
              <p className={styles.username}>{email.username}</p>
              <p className={styles.email}>{email.email}</p>
            </div>
            <div className={styles.buttonGroup}>
              {profileData.userId !== email._id && (
                <button
                  className={
                    theme === "dark" ? styles.button : styles.buttonLight
                  }
                  onClick={toggleFollow}
                >
                  {isFollow ? "已关注" : "关注"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchByEmail;
