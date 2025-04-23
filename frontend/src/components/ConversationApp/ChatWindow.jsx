/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { chatSocket } from "../socket.io/socket";
import styles from "./ChatWindow.module.css";
import { ThemeContext } from "../../context/ThemeContext";

const ChatWindow = ({ conversationId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const isFirstLoad = useRef(true); // 记录是否为首次加载
  const [otherUser, setOtherUser] = useState(null);
  const { theme } = useContext(ThemeContext);

  // 标记当前会话下接收者为当前用户的消息为已读
  const markMessagesAsRead = async () => {
    try {
      await axios.post(
        `http://localhost:3001/messages/${conversationId}/read`,
        { currentUserId },
        { withCredentials: true }
      );
      // 同步更新本地消息状态，将接收者为当前用户的消息标记为已读
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.senderId !== currentUserId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error("标记消息已读失败:", error);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3001/conversations/otherUser/${conversationId}`,
        { withCredentials: true }
      );
      setOtherUser(res.data);
    } catch (error) {
      console.error("获取对方用户信息失败:", error);
    }
  };
  useEffect(() => {
    if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
      fetchOtherUser();
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId && !currentUserId) return; // 如果没有 conversationId 或 currentUserId，则不执行后续操作

    async function fetchMessages() {
      try {
        const res = await axios.get(
          `http://localhost:3001/messages/${conversationId}`,
          { withCredentials: true }
        );
        setMessages(res.data);
        isFirstLoad.current = true; // 标记为首次加载
      } catch (error) {
        console.error("获取消息失败:", error);
      }
    }

    fetchMessages();

    chatSocket.emit("joinRoom", conversationId);

    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          // 如果消息已存在，则不添加
          if (prev.some((msg) => msg._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    };

    chatSocket.on("newMessage", handleNewMessage);

    return () => {
      chatSocket.off("newMessage", handleNewMessage);
    };
  }, [conversationId]);

  // 监听 messages 变化，滚动到底部
  useEffect(() => {
    if (messages.length === 0) return;

    if (isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstLoad.current = false;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 当用户一直停留在当前对话框内且有新消息（接收者为当前用户）时自动标记为已读
  useEffect(() => {
    if (!conversationId) return;

    // 筛选出未读且发送者不是当前用户的消息
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.senderId !== currentUserId
    );
    if (unreadMessages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, conversationId, currentUserId]);

  const sendMessage = async () => {
    if (otherUser?.state === "frozen") {
      console.warn("对方账号被冻结，消息未发送。");
      return;
    }

    if (input.trim()) {
      try {
        const res = await axios.post(
          "http://localhost:3001/messages",
          {
            conversationId,
            content: input,
          },
          { withCredentials: true }
        );
        const messageData = res.data.messageData;
        setMessages((prev) => [...prev, messageData]);
        chatSocket.emit("sendMessage", messageData);
        setInput("");
      } catch (error) {
        console.error("发送消息失败:", error);
      }
    }
  };

  const renderMessages = () => {
    const elements = [];
    let lastMessageTime = null;
    let lastElementType = "message";

    messages.forEach((msg) => {
      const currentTime = new Date(msg.createdAt);

      if (lastMessageTime) {
        const timeDiff = currentTime - lastMessageTime;
        const isDifferentDay =
          currentTime.toDateString() !== lastMessageTime.toDateString();
        const isOverFiveMinutes = timeDiff >= 5 * 60 * 1000;

        if (
          (isDifferentDay || isOverFiveMinutes) &&
          lastElementType !== "divider"
        ) {
          elements.push(
            <div key={`divider-${msg._id}`} className={styles.timeDivider}>
              {isDifferentDay
                ? currentTime.toLocaleDateString()
                : currentTime.toLocaleTimeString()}
            </div>
          );
          lastElementType = "divider";
        }
      }

      const isMe = msg.senderId === currentUserId;

      elements.push(
        <div
          key={msg._id}
          className={`${styles.message} ${
            isMe
              ? styles.me
              : theme === "dark"
              ? styles.other
              : styles.otherLight
          }`}
        >
          <p>{msg.content}</p>
        </div>
      );

      lastMessageTime = currentTime;
      lastElementType = "message";
    });

    // 如果对方被冻结，在消息末尾追加一条封禁提示
    if (otherUser?.state === "frozen") {
      elements.push(
        <div key="banned-warning" className={styles.bannedNoticeFinal}>
          ⚠️ 对方账号已封禁，您无法与其继续对话
        </div>
      );
    }

    return elements;
  };

  return (
    <div
      className={theme === "dark" ? styles.chatWindow : styles.chatWindowLight}
    >
      <div className={styles.messages}>
        {renderMessages()}
        <div ref={messagesEndRef} /> {/* 滚动锚点 */}
      </div>
      {conversationId && (
        <div
          className={
            theme === "dark" ? styles.inputArea : styles.inputAreaLight
          }
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={otherUser?.state === "frozen"}
          />
          <button
            onClick={sendMessage}
            disabled={otherUser?.state === "frozen" || !input.trim()}
          >
            发送
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
