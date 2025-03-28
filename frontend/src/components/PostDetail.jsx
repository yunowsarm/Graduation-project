/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./PostDetail.module.css";
import ImagePreviewModal from "./ImagePreviewModal";
import ActionBar from "./ActionBar";
import { useParams, useNavigate } from "react-router-dom";
import UserCard from "../components/UserCard/UserCard";
function PostDetail() {
  const [comments, setComments] = useState([]); // 评论列表
  const [newComment, setNewComment] = useState(""); // 新评论内容
  const [previewImageIndex, setPreviewImageIndex] = useState(null); // 当前预览图片的索引
  const [isLoading, setIsLoading] = useState(false); // 加载状态
  const [error, setError] = useState(""); // 错误信息
  const [updateComments, setUpdateComments] = useState(0);
  const [deepPost, setDeepPost] = useState({});
  const [depth, setDepth] = useState(0);
  const [originalUser, setOriginalUser] = useState({});
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const postContentRef = useRef(null);
  const originalPostContentRef = useRef(null);
  const deepPostContentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isPostExpanded, setIsPostExpanded] = useState(false); // 是否展开内容
  const [isOriginalPostExpanded, setIsOriginalPostExpanded] = useState(false); // 是否展开内容
  const [isDeepPostExpanded, setIsDeepPostExpanded] = useState(false); // 是否展开内容
  const [isPostOverflowing, setIsPostOverflowing] = useState(false);
  const [isOriginalPostOverflowing, setIsOriginalPostOverflowing] =
    useState(false);
  const [isDeepPostOverflowing, setIsDeepPostOverflowing] = useState(false);
  const [post, setPost] = useState({});
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isTooltipLocked, setIsTooltipLocked] = useState(false);

  const [isOriginalTooltipVisible, setIsOriginalTooltipVisible] =
    useState(false);
  const [isOriginalTooltipLocked, setIsOriginalTooltipLocked] = useState(false);
  const [isDeepTooltipVisible, setIsDeepTooltipVisible] = useState(false);
  const [isDeepTooltipLocked, setIsDeepTooltipLocked] = useState(false);

  const [hoveredIndex, setHoveredIndex] = useState(null);

  const navigate = useNavigate();

  const { postId } = useParams();
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

  const showOriginalTooltip = () => {
    setIsOriginalTooltipVisible(true);
  };

  const hideOriginalTooltip = () => {
    if (!isOriginalTooltipLocked) {
      setIsOriginalTooltipVisible(false);
    }
  };

  const lockOriginalTooltip = () => {
    setIsOriginalTooltipLocked(true);
  };

  const unlockOriginalTooltip = () => {
    setIsOriginalTooltipLocked(false);
    setIsOriginalTooltipVisible(false);
  };

  const showDeepTooltip = () => {
    setIsDeepTooltipVisible(true);
  };
  const hideDeepTooltip = () => {
    if (!isDeepTooltipLocked) {
      setIsDeepTooltipVisible(false);
    }
  };
  const lockDeepTooltip = () => {
    setIsDeepTooltipLocked(true);
  };
  const unlockDeepTooltip = () => {
    setIsDeepTooltipLocked(false);
    setIsDeepTooltipVisible(false);
  };

  // useEffect(() => {
  //   const savedScrollPosition = sessionStorage.getItem("scrollPosition");
  //   if (savedScrollPosition) {
  //     scrollContainerRef.current.scrollTo(0, parseInt(savedScrollPosition, 10));
  //   }

  //   const scrollContainer = scrollContainerRef.current;

  //   if (scrollContainer) {
  //     scrollContainer.addEventListener("scroll", handleScroll);
  //   }

  //   return () => {
  //     if (scrollContainer) {
  //       scrollContainer.removeEventListener("scroll", handleScroll);
  //     }
  //   };
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const handleBack = () => {
    // Save the current scroll position
    // if (scrollContainerRef.current) {
    //   sessionStorage.setItem(
    //     "scrollPosition",
    //     scrollContainerRef.current.scrollTop
    //   );
    // }
    navigate(-1);
  };

  const loadPost = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/posts/${postId}`);
      setPost(response.data.post);
      loadComments();
    } catch (err) {
      console.error(err);
    }
  };
  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3001/comments/${postId}`
      );
      setComments(response.data);
    } catch (err) {
      setError("加载评论失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };
  // 加载评论
  useEffect(() => {
    loadPost();
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadDeepPost = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/posts/forward/deepPosts/${postId}`
        );
        const originalPost = response.data.originalPost;
        setDeepPost(originalPost);
        setDepth(originalPost.depth);

        try {
          const resOriginalUser = await axios.get(
            `http://localhost:3001/user/originalUser/${originalPost.originalPostAuthor}`
          );
          setOriginalUser(resOriginalUser.data);
        } catch (error) {
          console.error(error);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDeepPost();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 提交评论
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/comments/add",
        {
          postId: postId,
          content: newComment,
        },
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
      setComments((prev) => [response.data.comment, ...prev]); // 更新评论列表
      setNewComment("");
      setUpdateComments((prev) => prev + 1);
    } catch (err) {
      setError("提交评论失败，请稍后重试");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setPreviewImageIndex(index); // 设置当前预览图片的索引
  };

  const handleCloseModal = () => {
    setPreviewImageIndex(null); // 关闭预览
  };
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const togglePostExpand = () => setIsPostExpanded(!isPostExpanded); // 切换现在帖子展开状态

  const toggleOriginalPostExpand = () =>
    setIsOriginalPostExpanded(!isOriginalPostExpanded); // 切换转发后帖子展开状态

  const toggleisDeepPostExpanded = () =>
    setIsDeepPostExpanded(!isDeepPostExpanded); // 切换现在帖子展开状态

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setIsButtonVisible(scrollTop > 600); // 页面滚动超过 600px 时显示按钮
    }
  };

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
        const maxHeight = lineHeight * 5; // 设置x行显示展开按钮
        setIsOriginalPostOverflowing(
          originalPostContentRef.current.scrollHeight > maxHeight
        );
      }
      if (deepPostContentRef.current) {
        const lineHeight = parseFloat(
          getComputedStyle(deepPostContentRef.current).lineHeight
        );
        const maxHeight = lineHeight * 4; // 设置x行显示展开按钮
        setIsDeepPostOverflowing(
          deepPostContentRef.current.scrollHeight > maxHeight
        );
      }
    }, 100); // 延迟以确保 DOM 已渲染完成
  }, []);
  return (
    <div className={styles.detailContainer} ref={scrollContainerRef}>
      <span className={styles.backButton} onClick={handleBack}>
        <i className="fi fi-sr-left"></i>
      </span>
      {post.isForwarded ? (
        <div className={styles.forwardPost}>
          {/* 转发后帖子*/}
          <div className={styles.forwardPostHeader}>
            {/* 转发后帖子的userInfo */}
            <div
              className={styles.forwardUserInfo}
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
            >
              <img src={post.avatar} className={styles.avatar} />
              <strong className={styles.userName}>{post.name}</strong>
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

          {/* 原始帖子*/}
          <div className={styles.post}>
            <div className={styles.postHeader}>
              <div
                className={styles.userInfo}
                onMouseEnter={showOriginalTooltip}
                onMouseLeave={hideOriginalTooltip}
              >
                <img src={post.originalPostAvatar} className={styles.avatar} />
                <strong className={styles.userName}>
                  {post.originalPostName}
                </strong>
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
              <span className={styles.postTime}>
                {formatDate(post.originalPostCreatedAt)}
              </span>
            </div>
            {/* 原始帖子的postContent */}
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
                  onClick={toggleOriginalPostExpand}
                >
                  {isOriginalPostExpanded ? "收起" : "更多"}
                </button>
              )}
              {/* 原始帖子的url */}
              {post.originalPostUrl && post.originalPostUrl.length > 0 && (
                <div className={styles.imageGrid}>
                  {post.originalPostUrl.map((imageUrl, index) => (
                    <div className={styles.gridItem} key={index}>
                      <img
                        src={imageUrl}
                        alt={`图片 ${index + 1}`}
                        className={styles.gridImage}
                        onClick={() => handleImageClick(index)} // 点击设置当前图片索引
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {depth > 1 && (
            <>
              <div className={styles.post}>
                <div className={styles.postHeader}>
                  <div
                    className={styles.userInfo}
                    onMouseEnter={showDeepTooltip}
                    onMouseLeave={hideDeepTooltip}
                  >
                    <img src={originalUser.avatar} className={styles.avatar} />
                    <strong className={styles.userName}>
                      {originalUser.username}
                    </strong>
                    {isDeepTooltipVisible && (
                      <div
                        className={styles.deepTooltip}
                        onMouseEnter={lockDeepTooltip}
                        onMouseLeave={unlockDeepTooltip}
                      >
                        <UserCard
                          userId={originalUser._id}
                          email={originalUser.email}
                          userName={originalUser.username}
                          avatar={originalUser.avatar}
                        />
                      </div>
                    )}
                  </div>
                  {/* 原始帖子的postTime */}
                  <span className={styles.postTime}>
                    {formatDate(originalUser.createdAt)}
                  </span>
                </div>
                {/* 原始帖子的postContent */}
                <div>
                  <p
                    ref={deepPostContentRef}
                    style={{ whiteSpace: "pre-line" }}
                    className={`${styles.forwardPostContent} ${
                      isDeepPostExpanded
                        ? styles.expanded
                        : styles.deepPostClamped
                    }`}
                  >
                    {deepPost.originalPostContent}
                  </p>
                  {isDeepPostOverflowing && (
                    <button
                      className={styles.expandButton}
                      onClick={toggleisDeepPostExpanded}
                    >
                      {isDeepPostExpanded ? "收起" : "更多"}
                    </button>
                  )}
                  {/* 原始帖子的url */}
                  {deepPost.originalPostUrl &&
                    deepPost.originalPostUrl.length > 0 && (
                      <div className={styles.imageGrid}>
                        {deepPost.originalPostUrl.map((imageUrl, index) => (
                          <div className={styles.gridItem} key={index}>
                            <img
                              src={imageUrl}
                              alt={`图片 ${index + 1}`}
                              className={styles.gridImage}
                              onClick={() => handleImageClick(index)} // 点击设置当前图片索引
                            />
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </>
          )}
          <ActionBar post={post} updateComments={updateComments} />
        </div>
      ) : (
        <div className={styles.post}>
          <div className={styles.postHeader}>
            <div
              className={styles.userInfo}
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
            >
              <img
                src={post.avatar}
                alt={`${post.name}的头像`}
                className={styles.avatar}
              />
              <strong className={styles.userName}>{post.name}</strong>
              {isTooltipVisible && (
                <div
                  className={styles.tooltip}
                  onMouseEnter={lockTooltip}
                  onMouseLeave={unlockTooltip}
                >
                  <UserCard
                    userId={post.userId}
                    email={post.email}
                    userName={post.name}
                    avatar={post.avatar}
                  />
                </div>
              )}
            </div>
            <span className={styles.postTime}>
              {formatDate(post.createdAt)}
            </span>
          </div>

          <p
            ref={postContentRef}
            style={{ whiteSpace: "pre-line" }}
            className={`${styles.postContent} ${
              isPostExpanded ? styles.expanded : styles.clamped
            }`}
          >
            {post.content}
          </p>
          {/* 显示“更多”或“收起”按钮 */}
          {isPostOverflowing && (
            <button className={styles.expandButton} onClick={togglePostExpand}>
              {isPostExpanded ? "收起" : "更多"}
            </button>
          )}

          {post.url && post.url.length > 0 && (
            <div className={styles.imageGrid}>
              {post.url.map((imageUrl, index) => (
                <div className={styles.gridItem} key={index}>
                  <img
                    src={imageUrl}
                    alt={`图片 ${index + 1}`}
                    className={styles.gridImage}
                    onClick={() => handleImageClick(index)} // 点击设置当前图片索引
                  />
                </div>
              ))}
            </div>
          )}
          <ActionBar post={post} updateComments={updateComments} />
        </div>
      )}

      <div className={styles.commentsSection}>
        <div className={styles.addComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            className={styles.commentInput}
          />
          <button
            onClick={handleCommentSubmit}
            className={styles.commentButton}
            disabled={isLoading} // 防止重复提交
          >
            发布
          </button>
          <h2>评论</h2>
          {isLoading && <p>加载中...</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.commentList}>
            {comments.map((comment, index) => (
              <div key={index} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <div
                    className={styles.userInfo}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <img
                      src={comment.authorInfo.avatar}
                      alt={`${comment.author.username}的头像`}
                      className={styles.commentAvatar}
                    />
                    <strong className={styles.commentUsername}>
                      {comment.authorInfo.username}
                    </strong>
                    {hoveredIndex === index && (
                      <div
                        className={styles.tooltip}
                        onMouseEnter={() => setHoveredIndex(index)} // 防止 tooltip 消失
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <UserCard
                          userId={comment.authorInfo.userId}
                          email={comment.authorInfo.email}
                          userName={comment.authorInfo.username}
                          avatar={comment.authorInfo.avatar}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <p
                  className={styles.commentContent}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {comment.content}
                </p>
                <span className={styles.commentTime}>
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewImageIndex !== null && (
        <ImagePreviewModal
          images={
            post.isForwarded
              ? post.originalPostUrl
                ? post.originalPostUrl
                : deepPost.originalPostUrl
              : post.url
              ? post.url
              : deepPost.originalPostUrl
          }
          initialIndex={previewImageIndex}
          onClose={handleCloseModal}
        />
      )}

      {/* 返回顶部按钮 */}
      {isButtonVisible && (
        <button
          onClick={() => {
            scrollContainerRef.current.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
          className={styles.scrollToTopButton}
        >
          <i className="fi fi-sr-up"></i>
        </button>
      )}
    </div>
  );
}

export default PostDetail;
