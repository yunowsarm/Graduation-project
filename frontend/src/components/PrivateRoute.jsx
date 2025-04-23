/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie"; // 用于操作 Cookies

function PrivateRoute({ children }) {
  // 从 Cookie 中获取令牌
  const token = Cookies.get("token");

  // 如果未找到令牌，重定向到登录页面
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 如果找到令牌，渲染子组件
  return children;
}

export default PrivateRoute;
