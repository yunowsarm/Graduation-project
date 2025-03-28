/* eslint-disable react/prop-types */
import axios from "axios";
import { useState, useEffect } from "react";
import styles from "./SearchByEmail.module.css";
function SearchByEmail({ emails = [] }) {
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
      {emails && (
        <div className={styles.container}>
          <div className={styles.userCard}>
            <div className={styles.userInfo}>
              <p className={styles.username}>{emails.username}</p>
              <p className={styles.email}>{emails.email}</p>
            </div>
            <div className={styles.buttonGroup}>
              {profileData.userId !== emails._id && (
                <button className={styles.button}>关注</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchByEmail;
