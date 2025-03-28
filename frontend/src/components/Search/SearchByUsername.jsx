/* eslint-disable react/prop-types */
import styles from "./SearchByUsername.module.css";
import axios from "axios";
import { useState, useEffect } from "react";
function SearchByUsername({ users = [] }) {
  const [profileData, setProfileData] = useState({});
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

  useEffect(() => {
    fetchUser();
  }, []);
  return (
    <>
      {Array.isArray(users) && (
        <div className={styles.container}>
          {users.map((user) => (
            <div key={user._id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <p className={styles.username}>{user.username}</p>
                <p className={styles.email}>{user.email}</p>
              </div>
              <div className={styles.buttonGroup}>
                {profileData.userId !== user._id && (
                  <button className={styles.button}>关注</button>
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
