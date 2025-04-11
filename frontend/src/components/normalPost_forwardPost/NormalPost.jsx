/* eslint-disable react/prop-types */
import styles from "./NormalPost.module.css";
import ActionBar from "../ActionBar";
import { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 引入 useNavigate
import UserCard from "../UserCard/UserCard";
import { ThemeContext } from "../../context/ThemeContext";
function NormalPost({
  post,
  handleContextMenu,
  setPreviewImageIndex,
  setCurrentPost,
  updateComments,
  fetchPosts,
}) {
  const [isPostExpanded, setIsPostExpanded] = useState(false);
  const [isPostOverflowing, setIsPostOverflowing] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isTooltipLocked, setIsTooltipLocked] = useState(false);
  const postContentRef = useRef(null);
  const navigate = useNavigate(); // 使用 useNavigate 进行路由导航
  const { theme } = useContext(ThemeContext);
  const togglePostExpand = (e) => {
    e.stopPropagation(); // 阻止冒泡，防止触发父级事件
    setIsPostExpanded(!isPostExpanded);
  };

  const handleImageClick = (index, post) => {
    setPreviewImageIndex(index);
    setCurrentPost(post);
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  useEffect(() => {
    setTimeout(() => {
      if (postContentRef.current) {
        const lineHeight = parseFloat(
          getComputedStyle(postContentRef.current).lineHeight
        );
        const maxHeight = lineHeight * 5; // 设置 x 行显示展开按钮
        setIsPostOverflowing(postContentRef.current.scrollHeight > maxHeight);
      }
    }, 100); // 延迟以确保 DOM 已渲染完成
  }, []);

  const showTooltip = () => {
    setIsTooltipVisible(true);
  };

  const hideTooltip = () => {
    if (!isTooltipLocked) {
      setIsTooltipVisible(false);
    }
  };

  const lockTooltip = () => {
    setIsTooltipLocked(true);
  };

  const unlockTooltip = () => {
    setIsTooltipLocked(false);
    setIsTooltipVisible(false);
  };

  const addViews = async () => {
    try {
      await axios.get(`http://localhost:3001/views/add/${post._id}`);
    } catch (err) {
      console.error(err);
    }
  };
  const handlePostClick = (e, post) => {
    // 如果是右键单击，直接返回
    if (e.button !== 0) return;

    // 如果用户选择了文字，不触发跳转
    const selection = window.getSelection();
    if (selection && selection.type === "Range") return;

    // 如果点击的不是图片或 ActionBar，才执行跳转
    if (
      !e.target.closest("img") &&
      !e.target.closest(`.${styles.actionBar}`) &&
      !e.target.closest(`.${styles.userInfo}`) &&
      !e.target.closest(`.${styles.postTime}`)
    ) {
      addViews();
      navigate(`/postDetail/${post.name}/${post._id}`); // 跳转到帖子详细页面，使用帖子 id
    }
  };

  // 一个简单的格式化函数示例

  return (
    <div
      className={theme === "dark" ? styles.post : styles.postLight}
      onContextMenu={handleContextMenu} // 局部禁用右键
      onMouseUp={(e) => {
        // 判断是否点击了按钮，避免触发父级事件
        if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
          return;
        }
        handlePostClick(e, post);
      }}
    >
      {/* postHeader包含头像名字和创建日期 */}
      <div className={styles.postHeader}>
        <div
          className={styles.userInfo}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <img src={post.avatar} className={styles.avatar} />
          <strong className={styles.userName}>{post.name}</strong>
          {/* 用户信息 Tooltip */}
          {isTooltipVisible && (
            <div
              className={styles.tooltip}
              onMouseEnter={lockTooltip}
              onMouseLeave={unlockTooltip}
            >
              <UserCard
                userId={post.userId}
                userName={post.name}
                email={post.email}
                avatar={post.avatar}
              />
            </div>
          )}
        </div>
        <span
          className={theme === "dark" ? styles.postTime : styles.postTimeLight}
        >
          {formatDate(post.createdAt)}
        </span>
      </div>
      {/* 内容区域 */}
      <div>
        <p
          ref={postContentRef}
          style={{ whiteSpace: "pre-line" }}
          className={`${styles.postContent} ${
            isPostExpanded ? styles.expanded : styles.clamped
          }`}
        >
          {post.content}
        </p>
        {isPostOverflowing && (
          <button
            className={styles.expandButton}
            onClick={(e) => togglePostExpand(e)}
          >
            {isPostExpanded ? "收起" : "更多"}
          </button>
        )}
        {post.url && post.url.length > 0 && (
          <div className={styles.imageGrid}>
            {post.url.slice(0, 9).map((imageUrl, imageIndex) => (
              <div className={styles.gridItem} key={imageIndex}>
                <img
                  src={imageUrl}
                  alt={`图片 ${imageIndex + 1}`}
                  className={styles.gridImage}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(imageIndex, post);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className={`${styles.actionBar}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ActionBar
          post={post}
          updateComments={updateComments}
          fetchPosts={fetchPosts}
        />
      </div>
    </div>
  );
}

export default NormalPost;
