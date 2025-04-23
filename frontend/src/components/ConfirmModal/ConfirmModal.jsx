/* eslint-disable react/prop-types */
// components/ConfirmModal.jsx

import styles from './ConfirmModal.module.css'; // 引入 CSS 模块

const ConfirmModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <p className={styles.modalMessage}>{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
          >
            确定
          </button>
          <button
            onClick={onCancel}
            className={`${styles.modalButton} ${styles.modalButtonCancel}`}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
