/* eslint-disable react/prop-types */
import styles from "./ForwardPost.module.css";
import ActionBar from "../ActionBar";
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom"; // 引入 useNavigate
import axios from "axios";
import UserCard from "../UserCard/UserCard";
import { ThemeContext } from "../../context/ThemeContext";
function ForwardPost({
  post,
  handleContextMenu,
  setPreviewImageIndex, // 预览图片的功能
  setCurrentPost, // 预览图片的功能
  updateComments,
  fetchPosts,
}) {
  const postContentRef = useRef(null);

  const originalPostContentRef = useRef(null);

  const [isPostExpanded, setIsPostExpanded] = useState(false); // 是否展开内容

  const [isOriginalPostExpanded, setIsOriginalPostExpanded] = useState(false); // 是否展开内容

  const [isPostOverflowing, setIsPostOverflowing] = useState(false);

  const [isOriginalPostOverflowing, setIsOriginalPostOverflowing] =
    useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isTooltipLocked, setIsTooltipLocked] = useState(false);

  const [isOriginalTooltipVisible, setIsOriginalTooltipVisible] =
    useState(false);
  const [isOriginalTooltipLocked, setIsOriginalTooltipLocked] = useState(false);

  const navigate = useNavigate(); // 使用 useNavigate 进行路由导航

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    setTimeout(() => {
      if (postContentRef.current) {
        const lineHeight = parseFloat(
          getComputedStyle(postContentRef.current).lineHeight
        );
        const maxHeight = lineHeight * 2; // 设置x行显示展开按钮
        setIsPostOverflowing(postContentRef.current.scrollHeight > maxHeight);
      }
      if (originalPostContentRef.current) {
        const lineHeight = parseFloat(
          getComputedStyle(originalPostContentRef.current).lineHeight
        );
        const maxHeight = lineHeight * 11; // 设置x行显示展开按钮
        setIsOriginalPostOverflowing(
          originalPostContentRef.current.scrollHeight > maxHeight
        );
      }
    }, 0); // 延迟以确保 DOM 已渲染完成
  }, []);

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
      !e.target.closest(`.${styles.forwardUserInfo}`) &&
      !e.target.closest(`.${styles.userInfo}`) &&
      !e.target.closest(`.${styles.forwardPostTime}`) &&
      !e.target.closest(`.${styles.postTime}`)
    ) {
      addViews();
      navigate(`/postDetail/${post.name}/${post._id}`); // 跳转到帖子详细页面，使用帖子 id
    }
  };
  const addViews = async () => {
    try {
      await axios.get(`http://localhost:3001/views/add/${post._id}`);
    } catch (err) {
      console.error(err);
    }
  };
  //预览图片的功能
  const handleImageClick = (index, post) => {
    setPreviewImageIndex(index);
    setCurrentPost(post);
  };
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const togglePostExpand = () => setIsPostExpanded(!isPostExpanded); // 切换现在帖子展开状态

  const toggleOriginalPostExpand = () =>
    setIsOriginalPostExpanded(!isOriginalPostExpanded); // 切换转发后帖子展开状态

  const showTooltip = () => {
    setIsTooltipVisible(true);
  };

  const showOriginalTooltip = () => {
    setIsOriginalTooltipVisible(true);
  };

  const hideTooltip = () => {
    if (!isTooltipLocked) {
      setIsTooltipVisible(false);
    }
  };

  const hideOriginalTooltip = () => {
    if (!isOriginalTooltipLocked) {
      setIsOriginalTooltipVisible(false);
    }
  };

  const lockTooltip = () => {
    setIsTooltipLocked(true);
  };

  const lockOriginalTooltip = () => {
    setIsOriginalTooltipLocked(true);
  };

  const unlockTooltip = () => {
    setIsTooltipLocked(false);
    setIsTooltipVisible(false);
  };

  const unlockOriginalTooltip = () => {
    setIsOriginalTooltipLocked(false);
    setIsOriginalTooltipVisible(false);
  };
  return (
    <div
      className={
        theme === "dark" ? styles.forwardPost : styles.forwardPostLight
      }
      onContextMenu={handleContextMenu} // 局部禁用右键
      onMouseUp={(e) => {
        // 判断是否点击了按钮，避免触发父级事件
        if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
          return;
        }
        handlePostClick(e, post);
      }}
    >
      {/* 转发后的帖子信息 */}
      {/* 转发后帖子的postHeader  */}
      <div className={styles.forwardPostHeader}>
        {/* 转发后帖子的userInfo */}
        <div
          className={styles.forwardUserInfo}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <img src={post.avatar} className={styles.forwardAvatar} />
          <strong className={styles.forwardUserName}>{post.name}</strong>
          {/* 用户信息 Tooltip */}
          {isTooltipVisible && (
            <div
              className={styles.tooltip}
              onMouseEnter={lockTooltip}
              onMouseLeave={unlockTooltip}
            >
              <UserCard
                userId={post.userId}
                email={post.email}
                avatar={post.avatar}
                userName={post.name}
              />
            </div>
          )}
        </div>
        {/* 转发后帖子的postTime */}
        <span
          className={
            theme === "dark"
              ? styles.forwardPostTime
              : styles.forwardPostTimeLight
          }
        >
          {formatDate(post.createdAt)}
        </span>
      </div>

      {/* 转发后帖子的postContent */}
      <div>
        <p
          ref={postContentRef}
          style={{ whiteSpace: "pre-line" }}
          className={`${styles.forwardPostContent} ${
            isPostExpanded ? styles.expanded : styles.clamped
          }`}
        >
          {post.content}
        </p>
        {/* 显示“更多”或“收起”按钮 */}
        {isPostOverflowing && (
          <button
            className={styles.expandButton}
            onClick={(e) => {
              e.stopPropagation(); // 阻止冒泡，避免触发 handlePostClick父级元素的click事件
              togglePostExpand();
            }}
          >
            {isPostExpanded ? "收起" : "更多"}
          </button>
        )}
      </div>

      {/* 原始帖子的信息 */}
      <div className={theme === "dark" ? styles.post : styles.postLight}>
        {/* 原始帖子的postHeader */}
        <div className={styles.postHeader}>
          {/* 原始帖子的userInfo */}
          <div
            className={styles.userInfo}
            onMouseEnter={showOriginalTooltip}
            onMouseLeave={hideOriginalTooltip}
          >
            <img src={post.originalPostAvatar} className={styles.avatar} />
            <strong className={styles.userName}>{post.originalPostName}</strong>
            {/* 用户信息 Tooltip */}
            {/* 把参数一个一个传递 */}
            {isOriginalTooltipVisible && (
              <div
                className={styles.originTooltip}
                onMouseEnter={lockOriginalTooltip}
                onMouseLeave={unlockOriginalTooltip}
              >
                <UserCard
                  userId={post.originalPostUserId}
                  email={post.originalPostEmail}
                  avatar={post.originalPostAvatar}
                  userName={post.originalPostName}
                />
              </div>
            )}
          </div>
          {/* 原始帖子的postTime */}
          <span
            className={
              theme === "dark" ? styles.postTime : styles.postTimeLight
            }
          >
            {formatDate(post.createdAt)}
          </span>
        </div>
        {/* 原始帖子内容 */}
        <div>
          {/* 原始帖子的postContent */}
          <p
            ref={originalPostContentRef}
            style={{ whiteSpace: "pre-line" }}
            className={`${styles.postContent} ${
              isOriginalPostExpanded
                ? styles.expanded
                : styles.originalPostClamped
            }`}
          >
            {post.originalPostContent || (
              <>
                <i className="fi fi-rr-paper-plane"></i>
                <span className={styles.unContent}>未编写内容</span>
              </>
            )}
          </p>
          {isOriginalPostOverflowing && (
            <button
              className={styles.expandButton}
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡，避免触发handlePostClick
                toggleOriginalPostExpand();
              }}
            >
              {isOriginalPostExpanded ? "收起" : "更多"}
            </button>
          )}
          {/* 原始帖子的url */}
          {Array.isArray(post.originalPostUrl) &&
            post.originalPostUrl.length > 0 && (
              <div className={styles.imageGrid}>
                {post.originalPostUrl
                  .slice(0, 9)
                  .map((imageUrl, imageIndex) => (
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

export default ForwardPost;
