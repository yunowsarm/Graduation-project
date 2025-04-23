import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { useEffect, useState } from "react";
import styles from "./ChatBox.module.css";
import axios from "axios";
function ChatBox() {
  const [currentConversation, setCurrentConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState({});
  useEffect(() => {
    async function getUser() {
      const res = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true,
      });
      setCurrentUser(res.data);
    }
    getUser();
  }, []);
  return (
    <div className={styles.messages_container}>
      <ConversationList
        setCurrentConversation={setCurrentConversation}
        currentUserId={currentUser.id}
      />
      <ChatWindow
        conversationId={currentConversation}
        currentUserId={currentUser.id}
      />
    </div>
  );
}

export default ChatBox;
