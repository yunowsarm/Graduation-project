import styles from "./OwnFollow.module.css";
import { useState, useEffect} from "react";
import axios from "axios";
function OwnFollow() {
  const [follows, setFollows] = useState([]);
  const getFollows = async () => {
    try {
      const res = await axios.get("http://localhost:3001/user/follows", {
        withCredentials: true,
      });
      setFollows(res.data.follows);
      console.log(res.data.follows);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getFollows();
  }, []);
  return (
    <>
      {follows.map((user, index) => (
        <div key={user._id || index} className={styles.container}>
          <div className={styles.userCard}>
            <div className={styles.userInfo}>
              <img className={styles.avatar} src={user.avatar} alt="avatar" />
              <p className={styles.username}>{user.username}</p>
              <p className={styles.email}>{user.email}</p>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.button}>取消关注</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default OwnFollow;
