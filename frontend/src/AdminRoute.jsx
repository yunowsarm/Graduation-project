/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import axios from "axios";

function AdminRoute({ children }) {
  const [userData, setUserData] = useState(null);
  const token = Cookies.get("token");

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true, // 确保发送 Cookie
      });
      setUserData(response.data);
      console.log("用户数据:", response.data);
    } catch (error) {
      console.error("获取用户失败:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (userData === null) {
    // 在获取用户数据前，不做任何渲染，或展示加载状态
    return <div>Loading...</div>;
  }

  if (!token || userData.role !== "manager") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
