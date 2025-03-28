import { useEffect } from "react";
import styles from "./Form.module.css";
//自动聚焦
function useAutoFocusInputs() {
  useEffect(() => {
    // 获取所有的输入框
    const inputs = document.querySelectorAll(`.${styles.inputGroup} input`);

    inputs.forEach((input) => {
      // 聚焦输入框
      input.focus();
      input.blur(); // 确保不会长期保持聚焦，避免 UI 干扰
    });
  }, []);
}

export default useAutoFocusInputs;
