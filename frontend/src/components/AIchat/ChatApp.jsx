import { useState, useRef, useEffect, useContext } from "react";
import styles from "./ChatApp.module.css";
import { ThemeContext } from "../../context/ThemeContext";
function ChatApp() {
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef(null);
  const { theme } = useContext(ThemeContext);
  useEffect(() => {
    if (chatWindowRef.current) {
      // 让滚动条始终滚动到底部
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatLog]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 将用户消息添加到对话记录中
    setChatLog((prev) => [...prev, { role: "user", content: input }]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: input }),
      });

      if (!response.ok || !response.body) {
        throw new Error("网络响应错误");
      }

      // 从响应流中逐块读取数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let assistantMessage = "";

      // 在 chatLog 中先添加一个空的 AI 回复记录
      setChatLog((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        // 更新最后一条 AI 回复消息
        setChatLog((prev) => {
          const newLog = [...prev];
          newLog[newLog.length - 1] = {
            role: "assistant",
            content: assistantMessage,
          };
          return newLog;
        });
      }
    } catch (error) {
      console.error("调用接口出错:", error);
      setChatLog((prev) => [
        ...prev,
        { role: "assistant", content: "调用接口出错，请稍后再试。" },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div
      className={
        theme === "dark" ? styles.chatContainer : styles.chatContainerLight
      }
    >
      <h2 className={styles.header}>文案助手</h2>
      <div
        className={
          theme === "dark" ? styles.chatWindow : styles.chatWindowLight
        }
        ref={chatWindowRef}
      >
        {chatLog.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              msg.role === "assistant"
                ? theme === "dark"
                  ? styles.assistant
                  : styles.assistantLight
                : theme === "dark"
                ? styles.user
                : styles.userLight
            }`}
            // 为了让换行符生效
            style={{ whiteSpace: "pre-wrap" }}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <input
          type="text"
          placeholder="请输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={theme === "dark" ? styles.input : styles.inputLight}
          disabled={loading}
        />
        <button
          type="submit"
          className={theme === "dark" ? styles.button : styles.buttonLight}
          disabled={loading}
        >
          {loading ? "发送中..." : "发送"}
        </button>
      </form>
    </div>
  );
}

export default ChatApp;
