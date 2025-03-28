/* eslint-disable react/prop-types */
import { useState } from "react";
import axios from "axios";
import styles from "./Form.module.css";
import useAutoFocusInputs from "./useAutoFocusInputs";
import { useNavigate } from "react-router-dom";


function AuthForm({ toggleForm }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [errorTimer, setErrorTimer] = useState(null);
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      // 在配置中传递);
      console.log(response.data);
      // 登录成功，跳转到主页
      navigate("/homepage");
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "登录失败，请检查您的账号和密码";

      setErrorMessage(errorMsg);
      setIsErrorVisible(true);

      // 清除之前的计时器，避免冲突
      if (errorTimer) {
        clearTimeout(errorTimer);
      }

      // 设置新计时器两秒后隐藏错误信息
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
      }, 2000);
      setErrorTimer(timer);
    }
  };
  useAutoFocusInputs();
  return (
    <div className={styles.form}>
      <h2>登录</h2>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="账号"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className={styles.label}>账号</label>
      </div>
      <div className={styles.inputGroup}>
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className={styles.label}>密码</label>
      </div>
      <div
        className={`${styles.error} ${
          isErrorVisible ? styles.errorVisible : styles.errorHidden
        }`}
      >
        {errorMessage}
      </div>
      <button onClick={handleLogin}>登录</button>
      <p
        onClick={() => {
          toggleForm();
        }}
        className={styles.toggle}
      >
        还没有帐号?
      </p>
    </div>
  );
}

export default AuthForm;
