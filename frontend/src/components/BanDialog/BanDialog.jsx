/* eslint-disable react/prop-types */
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./BanDialog.module.css";

function BanDialog({ open, onClose }) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>发帖失败</Dialog.Title>
          <Dialog.Description className={styles.description}>
            你已被封禁，无法发帖！
          </Dialog.Description>
          <div className={styles.footer}>
            <button onClick={() => onClose(false)} className={styles.button}>
              知道了
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default BanDialog;
