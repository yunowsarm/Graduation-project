import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import styles from "./DrawApp.module.css";
import { ThemeContext } from "../../context/ThemeContext";
function DrawApp() {
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef(null);
  const { theme } = useContext(ThemeContext);
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatLog]);

  // 发送消息并调用后端 API
  const sendMessage = async () => {
    if (!input.trim()) return;

    setChatLog((prev) => [...prev, { role: "user", content: input }]);
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/draw",
        { prompt: input },
        { headers: { "Content-Type": "application/json" } }
      );

      setChatLog((prev) => [
        ...prev,
        { role: "assistant", content: response.data.url, prompt: input },
      ]);
    } catch (error) {
      setChatLog((prev) => [
        ...prev,
        { role: "assistant", content: "调用 AI 接口时出错: " + error.message },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleDownload = async (imageUrl, prompt) => {
    try {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const sanitizedPrompt = prompt.replace(
        /[^a-zA-Z0-9_\u4e00-\u9fa5]/g,
        "_"
      );
      const filename = `${sanitizedPrompt}_${randomId}.png`;

      const proxyUrl = `http://localhost:3001/api/proxy-image?url=${encodeURIComponent(
        imageUrl
      )}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("网络响应错误");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("下载图片出错:", error);
    }
  };

  return (
    <div
      className={
        theme === "dark" ? styles.chatContainer : styles.chatContainerLight
      }
    >
      <h2 className={styles.header}>绘画助手</h2>
      <div
        className={
          theme === "dark" ? styles.chatWindow : styles.chatWindowLight
        }
        ref={chatWindowRef}
      >
        {chatLog.map((msg, index) => {
          const userPrompt =
            chatLog
              .slice(0, index)
              .reverse()
              .find((m) => m.role === "user")?.content || "ai_generated_image";

          return (
            <>
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
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.role === "assistant" &&
                typeof msg.content === "string" &&
                msg.content?.startsWith("http") ? (
                  <div className={styles.imageContainer}>
                    <img
                      src={msg.content}
                      alt="AI 绘画"
                      style={{ maxWidth: "100%" }}
                    />
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "assistant" && msg.content.startsWith("http") && (
                <button
                  className={styles.downloadButton}
                  onClick={() => handleDownload(msg.content, userPrompt)}
                >
                  下载
                </button>
              )}
            </>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <input
          type="text"
          placeholder="请输入提示词(例如：小猫，阳台...)"
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

export default DrawApp;
