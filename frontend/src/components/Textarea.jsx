/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useContext } from "react";
import styles from "./Textarea.module.css";
import Emoji from "./Emoji";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";
import BanDialog from "./BanDialog/BanDialog";

function Textarea({ fetchPosts, setIsLoading, outerLayerRef }) {
  const [imgclass, setImgClass] = useState("fi fi-rr-add-image");
  const [emojiclass, setEmojiClass] = useState("fi fi-rr-laugh-squint");
  const [inputValue, setInputValue] = useState(""); // 存储输入框内容
  const [Urls, setUrls] = useState([]); // 存储图片预览 URL 列表
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);
  const InputRef = useRef(null); // 引用文件输入框
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const [files, setFiles] = useState([]); // 选中的文件
  const [toastMessage, setToastMessage] = useState(""); // 用于存储提示信息
  const toastTimeoutRef = useRef(null); // 初始化为 null，用来保存定时器 ID
  const [showToast, setShowToast] = useState(false);
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [showBanDialog, setShowBanDialog] = useState(false);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleMouse = (type, classname) => {
    if (type === "img") {
      setImgClass(classname);
    } else if (type === "emoji") {
      setEmojiClass(classname);
    }
  };

  const toggleEmojiPicker = () => {
    if (!showEmojiPicker) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handlePost = async () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      if (user.state === "active") {
        const uploadResponse = await axios.post(
          "http://localhost:3001/Content/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data", //多个数据的请求头
            },
          }
        );

        const fileUrls = uploadResponse.data.fileUrls; // 直接获取返回的文件 URLs
        // setUrls((prev) => [...prev, ...fileUrls]); // 更新预览图片的 URL 列表
        await axios.post(
          "http://localhost:3001/Content/addContent",
          {
            content: inputValue,
            urls: fileUrls,
          },
          {
            withCredentials: true,
          }
        );
        setInputValue("");
        setUrls([]);
        setFiles([]); // 清空选中的文件
        textareaRef.current.style.height = "auto"; // 重置文本框高度
        fetchPosts(); // 重新加载帖子
        outerLayerRef.current.scrollTo({ top: 0, behavior: "instant" }); // 直接滚动到顶部
      } else {
        setShowBanDialog(true);
        return;
      }
    } catch (error) {
      console.error("发帖失败:", error);
      alert("发帖失败，请稍后再试！");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInputValue((prev) => prev + emoji.native);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files); // 获取新选中的文件

    // 判断是否超出最大数量限制
    if (files.length + newFiles.length > 9) {
      showOutofImage();
      return;
    }

    const newFileUrls = newFiles.map((file) => URL.createObjectURL(file)); // 生成预览 URL

    setFiles((prevFiles) => [...prevFiles, ...newFiles]); // 追加到现有文件列表
    setUrls((prevUrls) => [...prevUrls, ...newFileUrls]); // 更新预览 URL 列表
  };

  const removeFile = (index) => {
    const url = Urls[index];
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
    // 清理 URL
    URL.revokeObjectURL(url);
  };

  const showOutofImage = () => {
    // 清除上一个定时器（如果有）
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage("图片上限为9张!");
    setShowToast(true);

    // 启动新的定时器，在3秒后隐藏提示框
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false); // 隐藏提示框
    }, 1000);
  };

  const handleImageUpload = () => {
    if (files.length >= 9) {
      showOutofImage(); // 超出图片上限时显示提示框
    } else {
      InputRef.current.value = ""; // 清空文件输入框
      InputRef.current.click();
    }
  };

  return (
    <div className={styles.postSection}>
      {/* 提示框 */}

      <div
        className={`${styles.toast} ${showToast ? styles.show : styles.hide}`}
      >
        {toastMessage}
      </div>

      <div className={styles.textareaContainer}>
        <textarea
          ref={textareaRef}
          placeholder="有什么新鲜事？!"
          className={`${theme === "dark" ? styles.input : styles.inputLight} ${
            styles.hiddenScrollbar
          }`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          rows={1}
          style={{ resize: "none" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />

        {/* 图片预览 */}
        {Urls.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            {Urls.slice(0, 9).map((url, index) => (
              <div className={styles.imagePreview} key={index}>
                <img src={url} alt={`Preview image ${index + 1}`} />
                <button
                  className={styles.removeButton}
                  onClick={() => removeFile(index)}
                  aria-label={`Remove image ${index + 1}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            className={`${
              theme === "dark" ? styles.iconButton : styles.iconButtonLight
            } ${styles.imageButton}`}
            onMouseEnter={() => handleMouse("img", "fi fi-br-add-image")}
            onMouseLeave={() => handleMouse("img", "fi fi-rr-add-image")}
            onClick={() => handleImageUpload()}
          >
            <i className={imgclass}></i>
          </button>

          <input
            ref={InputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange} // 处理文件选择
          />

          <button
            ref={emojiButtonRef}
            className={`${
              theme === "dark" ? styles.iconButton : styles.iconButtonLight
            } ${styles.emojiButton}`}
            onClick={toggleEmojiPicker}
            onMouseEnter={() => handleMouse("emoji", "fi fi-br-laugh-squint")}
            onMouseLeave={() => handleMouse("emoji", "fi fi-rr-laugh-squint")}
          >
            <i className={emojiclass}></i>
          </button>
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={
              theme === "dark" ? styles.postButton : styles.postButtonLight
            }
            onClick={handlePost}
            disabled={!inputValue && !files.length}
          >
            发帖
          </button>
        </div>
      </div>

      {/* 表情栏 */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
          }}
        >
          <Emoji onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
      <BanDialog open={showBanDialog} onClose={setShowBanDialog} />
    </div>
  );
}

export default Textarea;
