/* eslint-disable react/prop-types */
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import styles from "./ConversationList.module.css";
import { chatSocket } from "../socket.io/socket";
import { ThemeContext } from "../../context/ThemeContext";
// eslint-disable-next-line react/prop-types
const ConversationList = ({
  setCurrentConversation,
  currentUserId,
}) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const { theme } = useContext(ThemeContext);
  // 获取会话列表 
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await axios.get("http://localhost:3001/conversations", {
          withCredentials: true,
        });
        console.log(res.data);
        setConversations(res.data);
      } catch (error) {
        console.error("获取会话失败:", error);
      }
    }
    fetchConversations();
  }, []);

  // 监听服务端广播的消息已读事件
  useEffect(() => {
    if (!currentUserId) return;
    chatSocket.on("messageRead", handleMessageRead);
    chatSocket.on("newMessage", handleNewMessages);
    // 清除监听器，防止内存泄露
    return () => {
      chatSocket.off("messageRead", handleMessageRead);
      chatSocket.off("newMessage", handleNewMessages);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // 标记当前会话下接收者为当前用户的消息为已读
  const markMessagesAsRead = async () => {
    try {
      await axios.post(
        `http://localhost:3001/messages/${selectedConversationId}/read`,
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

  useEffect(() => {
    if (!selectedConversationId) return;

    // 获取最新的消息
    const latestMessage = messages.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    console.log(latestMessage);

    // 确保最新消息的 conversationId 和选中的会话匹配
    if (
      latestMessage &&
      latestMessage.conversationId === selectedConversationId
    ) {
      // 筛选未读且发送者不是当前用户的消息
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId !== currentUserId
      );

      if (unreadMessages.length > 0) {
        markMessagesAsRead();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, currentUserId, messages]);

  const handleNewMessages = (data) => {
    const { conversationId } = data;
    setMessages((prevMessages) => [...prevMessages, data]);
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv._id === conversationId && conv.receiverId === currentUserId
          ? { ...conv, isRead: false }
          : conv
      )
    );
  };

  const handleMessageRead = (data) => {
    const { conversationId, userId } = data;
    // 更新会话的 isRead 状态
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv._id === conversationId && conv.receiverId === userId
          ? { ...conv, isRead: true }
          : conv
      )
    );
    // 更新 messages 中对应会话的所有消息的 isRead 状态
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.conversationId === conversationId ? { ...msg, isRead: true } : msg
      )
    );
  };

  // 点击会话时，加入房间并通知服务器标记消息为已读
  const handleConversationClick = (conv) => {
    setCurrentConversation(conv._id);
    setSelectedConversationId(conv._id);

    // 加入当前会话的房间
    chatSocket.emit("joinRoom", conv._id);

    // 标记该会话消息已读，并通知房间内其他用户
    chatSocket.emit("markMessageAsRead", {
      conversationId: conv._id,
      userId: currentUserId,
    });
  };

  return (
    <div
      className={
        theme === "dark"
          ? styles.conversationList
          : styles.conversationListLight
      }
    >
      {conversations &&
        conversations.length > 0 &&
        conversations.map((conv) => {
          // 找到该会话的最新消息
          const latestMessage = messages
            .filter((msg) => msg.conversationId === conv._id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          return (
            <div
              key={conv._id}
              className={`${
                theme === "dark"
                  ? styles.conversationItem
                  : styles.conversationItemLight
              } ${
                selectedConversationId === conv._id
                  ? theme === "dark"
                    ? styles.selected
                    : styles.selectedLight
                  : ""
              }`}
              onClick={() => handleConversationClick(conv)}
            >
              <div>
                <img
                  className={styles.avatar}
                  src={conv.otherParticipant.avatar}
                  alt="头像"
                />
                {/* 只有当最新消息未读 & 当前用户是接收者才显示红点 */}
                {latestMessage &&
                  !latestMessage.isRead &&
                  latestMessage.receiverId === currentUserId && (
                    <div className={styles.redDot}></div>
                  )}
                <span
                  className={
                    theme === "dark" ? styles.username : styles.usernameLight
                  }
                >
                  {conv.otherParticipant.username}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ConversationList;
