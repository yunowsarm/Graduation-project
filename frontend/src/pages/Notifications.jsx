import Notification from "../components/Notifications/Notifications";
import { useEffect, useState } from "react";
import axios from "axios";
function Notifications() {
  const [currentUserId, setCurrentUserId] = useState({});
  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true, // 确保发送 Cookie
      });
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error("获取用户失败:", error);
    }
  };

  useEffect( () => {
    fetchUser();
  }, []);
  return <Notification currentUserId={currentUserId} />;
}

export default Notifications;
