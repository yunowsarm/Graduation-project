/* eslint-disable react/prop-types */
import { useState } from "react";
import axios from "axios";
import styles from "./Form.module.css";
import useAutoFocusInputs from "./useAutoFocusInputs";
function RegisterForm({ toggleForm }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async () => {
    // 表单验证
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("请填写所有字段");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("两次密码输入不一致");
      return;
    }

    try {
      // 调用后端注册接口
      const response = await axios.post("http://localhost:3001/register", {
        username,
        email,
        password,
      });

      // 处理注册成功
      setSuccessMessage(response.data.message || "注册成功！");
      setErrorMessage("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // 切换到登录界面
      setTimeout(() => {
        toggleForm();
      }, 2000);
    } catch (error) {
      // 处理注册失败
      console.error(error);
      setErrorMessage(error.response?.data?.message || "注册失败，请稍后再试");
    }
  };
  useAutoFocusInputs();
  return (
    <div className={styles.form}>
      <h2>注册</h2>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className={styles.label}>用户名</label>
      </div>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className={styles.label}>邮箱</label>
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
      <div className={styles.inputGroup}>
        <input
          type="password"
          placeholder="确认密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <label className={styles.label}>确认密码</label>
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      <button onClick={handleRegister}>注册</button>
      <p
        onClick={() => {
          toggleForm();
        }}
        className={styles.toggle}
      >
        已有帐号?
      </p>
    </div>
  );
}

export default RegisterForm;
