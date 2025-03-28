import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthForm from "./AuthForm";
import RegisterForm from "./RegisterForm";
import styles from "./ManageForm.module.css";

function ManageForm() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div className={styles.app}>
      <AnimatePresence mode="wait">
        {isLogin ? (
          <motion.div
            key="login"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AuthForm toggleForm={toggleForm} />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <RegisterForm toggleForm={toggleForm} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ManageForm;
