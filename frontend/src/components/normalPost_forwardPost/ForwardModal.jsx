/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import styles from "./ForwardModal.module.css";
function ForwardModal({ show, onClose, post, onForward, fetchPosts }) {
  const [content, setContent] = useState("");
  const [isPostExpanded, setIsPostExpanded] = useState(false); // 是否展开内容
  const [isOriginalPostExpanded, setIsOriginalPostExpanded] = useState(false); // 是否展开内容
  const postContentRef = useRef(null);
  const [isPostOverflowing, setIsPostOverflowing] = useState(false);
  const originalPostContentRef = useRef(null);
  const [isOriginalPostOverflowing, setIsOriginalPostOverflowing] =
    useState(false);

  useEffect(() => {
    if (show) {
      setIsPostExpanded(false);
      setIsOriginalPostExpanded(false);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
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
    }
  }, [show, post]);

  const handleForward = async () => {
    await onForward(content);
    if (fetchPosts) {
      await fetchPosts();
    }

    onClose(); // 再关闭模态框
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const togglePostExpand = () => setIsPostExpanded(!isPostExpanded); // 切换现在帖子展开状态
  const toggleOriginalPostExpand = () =>
    setIsOriginalPostExpanded(!isOriginalPostExpanded); // 切换转发后帖子展开状态

  return (
    <>
      {show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>转发帖子</h3>
            <textarea
              className={styles.input}
              placeholder="添加转发内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className={styles.originalPost}>
              {post.isForwarded ? (
                <>
                  <div className={styles.forwardPost}>
                    {/* 转发后的帖子信息 */}
                    {/* 转发后帖子的postHeader  */}
                    <div className={styles.forwardPostHeader}>
                      {/* 转发后帖子的userInfo */}
                      <div className={styles.forwardUserInfo}>
                        <img
                          src={post.avatar}
                          className={styles.forwardAvatar}
                        />
                        <strong className={styles.forwardUserName}>
                          {post.name}
                        </strong>
                      </div>
                      {/* 转发后帖子的postTime */}
                      <span className={styles.forwardPostTime}>
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
                          onClick={togglePostExpand}
                        >
                          {isPostExpanded ? "收起" : "更多"}
                        </button>
                      )}
                    </div>
                    {/* 原始帖子的信息 */}
                    <div className={styles.post}>
                      {/* 原始帖子的postHeader */}
                      <div className={styles.postHeader}>
                        {/* 原始帖子的userInfo */}
                        <div className={styles.userInfo}>
                          <img
                            src={post.originalPostAvatar}
                            className={styles.avatar}
                          />
                          <strong className={styles.userName}>
                            {post.originalPostName}
                          </strong>
                        </div>
                        {/* 原始帖子的postTime */}
                        <span className={styles.postTime}>
                          {formatDate(post.originalPostCreatedAt)}
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
                          {post.originalPostContent}
                        </p>
                        {isOriginalPostOverflowing && (
                          <button
                            className={styles.expandButton}
                            onClick={toggleOriginalPostExpand}
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
                                  <div
                                    className={styles.gridItem}
                                    key={imageIndex}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`图片 ${imageIndex + 1}`}
                                      className={styles.gridImage}
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.post}>
                    {/* postHeader包含头像名字和创建日期 */}
                    <div className={styles.postHeader}>
                      <div className={styles.userInfo}>
                        <img src={post.avatar} className={styles.avatar} />
                        <strong className={styles.userName}>{post.name}</strong>
                      </div>
                      <span className={styles.postTime}>
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    {/* 内容区域 */}
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
                          onClick={togglePostExpand}
                        >
                          {isPostExpanded ? "收起" : "更多"}
                        </button>
                      )}
                      {post.url.length > 0 && (
                        <div className={styles.imageGrid}>
                          {post.url.slice(0, 9).map((imageUrl, imageIndex) => (
                            <div className={styles.gridItem} key={imageIndex}>
                              <img
                                src={imageUrl}
                                alt={`图片 ${imageIndex + 1}`}
                                className={styles.gridImage}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className={styles.buttonContainer}>
              <button className={styles.cancelButton} onClick={onClose}>
                取消
              </button>
              <button className={styles.confirmButton} onClick={handleForward}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ForwardModal;
