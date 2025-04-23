/* eslint-disable react/prop-types */
import styles from "./OwnFollow.module.css";
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { ThemeContext } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
function OwnFollow({ canScroll, setCanParentScroll }) {
  const [follows, setFollows] = useState([]);
  const postsRef = useRef(null);
  const postsElement = postsRef.current;
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  // 监听子组件的滚动事件
  const handleChildScroll = () => {
    if (postsElement) {
      if (postsElement.scrollTop === 0) {
        // 当滚动到顶部时，通知父组件
        setCanParentScroll(true);
      } else {
        // 如果没有滚动到顶部，通知父组件
        setCanParentScroll(false);
      }
    }
  };

  const getFollows = async () => {
    try {
      const res = await axios.get("http://localhost:3001/user/follows", {
        withCredentials: true,
      });
      setFollows(res.data.follows);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!canScroll) return;
    const postsElement = postsRef.current;
    if (postsElement && canScroll) {
      postsElement.addEventListener("scroll", handleChildScroll);
    }
    return () => {
      if (postsElement && canScroll) {
        postsElement.removeEventListener("scroll", handleChildScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canScroll]);

  useEffect(() => {
    getFollows();
  }, []);

  const handleUnfollow = async (userId) => {
    try {
      await axios.post(
        "http://localhost:3001/follow/removeFollow",
        { userId },
        { withCredentials: true }
      );
      getFollows();
    } catch (error) {
      console.error("取消关注失败:", error);
    }
  };

  const sendMessage = async (userId) => {
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
    <div
      className={`${
        theme === "dark" ? styles.ownFollow : styles.ownFollowLight
      } ${canScroll ? styles.scrollable : ""}`}
      ref={postsRef}
    >
      {follows.length > 0 ? (
        follows.map((user, index) => (
          <div
            key={user._id || index}
            className={
              theme === "dark" ? styles.container : styles.containerLight
            }
          >
            <div
              className={
                theme === "dark" ? styles.userCard : styles.userCardLight
              }
            >
              <div className={styles.userInfo}>
                <img className={styles.avatar} src={user.avatar} alt="avatar" />
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
                <button
                  className={styles.button}
                  onClick={() => handleUnfollow(user._id)}
                >
                  取消关注
                </button>
                <button
                  className={styles.MessageButton}
                  onClick={() => sendMessage(user._id)}
                >
                  私信
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p
          className={theme === "dark" ? styles.noFollow : styles.noFollowLight}
        >
          暂无关注
        </p>
      )}
    </div>
  );
}

export default OwnFollow;
