import styles from "./AIPartBar.module.css";
import ChatApp from "./AIchat/ChatApp";
import DrawApp from "./AIchat/DrawApp";
import { ThemeContext } from "../context/ThemeContext";
import { useContext } from "react";
function AIPartBar() {
  const { theme } = useContext(ThemeContext);
  return (
    <div
      className={
        theme === "dark" ? styles.recommendations : styles.recommendationsLight
      }
    >
      <ChatApp />
      <DrawApp />
    </div>
  );
}
export default AIPartBar;
