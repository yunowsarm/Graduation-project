import { useState } from "react";
import ReactDOM from "react-dom";
import styles from "./Modal.module.css";
import axios from "axios";
const Modal = ({ profileData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: profileData.username,
    avatar: profileData.avatar,
    sign: profileData.sign,
  });

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await axios.post(
        "http://localhost:3001/Content/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.fileUrls[0];
    } catch (error) {
      console.error("头像上传失败:", error);
      throw new Error("头像上传失败，请重试！");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const uploadedAvatarUrl = await uploadAvatar(file);
        setFormData({ ...formData, avatar: uploadedAvatarUrl });
      } catch (error) {
        alert("头像上传失败，请稍后再试！");
      }
    }
  };

  const handleSubmit = () => {
    // 更新数据并关闭模态窗口
    onUpdate(formData);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={styles.modal_overlay}>
      <div className={styles.modal}>
        <div className={styles.avatar_section}>
          <label className={styles.avatar_container}>
            <img
              src={formData.avatar}
              alt="avatar preview"
              className={styles.avatar_preview}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.hidden_input}
            />
          </label>
        </div>
        <div className={styles.form_group}>
          <label>用户名</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.form_group}>
          <label>签名</label>
          <input
            type="text"
            name="sign"
            value={formData.sign || ""}
            placeholder="请输入您的签名"
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.modal_actions}>
          <button onClick={handleSubmit} className={styles.save_button}>
            保存
          </button>
          <button onClick={onClose} className={styles.cancel_button}>
            取消
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
