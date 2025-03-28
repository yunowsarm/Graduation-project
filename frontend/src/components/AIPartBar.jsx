import styles from "./AIPartBar.module.css";
import ChatApp from "./AIchat/ChatApp";
import DrawApp from "./AIchat/DrawApp";
function AIPartBar() {
  return (
    <div className={styles.recommendations}>
     <ChatApp />
     <DrawApp />
    </div>
  );
}
export default AIPartBar;
