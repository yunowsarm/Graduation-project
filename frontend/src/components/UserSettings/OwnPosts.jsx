/* eslint-disable react/prop-types */
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import styles from "./OwnPosts.module.css";
import ImagePreviewModal from "../ImagePreviewModal";
import PostDetailModal from "./PostDetailModal";

function OwnPosts({ canScroll, setCanParentScroll }) {
  const [posts, setPosts] = useState([]);
  const postsRef = useRef(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false); // 帖子详情窗口的状态
  const postsElement = postsRef.current;

  // 监听子组件的滚动事件
  const handleChildScroll = () => {
    if (postsElement) {
      if (postsElement.scrollTop === 0) {
        // 当滚动到顶部时，通知父组件
        setCanParentScroll(true);
      } else {
        // 如果没有滚动到顶部，通知父组件
        setCanParentScroll(false);
      }
    }
  };

  // 打开帖子详情窗口
  const handlePostClick = (post) => {
    if (postsElement.scrollTop === 0) {
      setCanParentScroll(false);
    }
    setCurrentPost(post);
    setShowPostDetail(true);
  };

  // 关闭帖子详情窗口
  const handleClosePostDetail = () => {
    if (postsElement.scrollTop === 0) {
      setCanParentScroll(true);
    }
    setCurrentPost(null);
    setShowPostDetail(false);
  };

  // 处理图片点击
  const handleImageClick = (index, post) => {
    setPreviewImageIndex(index);
    setCurrentPost(post);
  };

  // 关闭图片预览窗口
  const handleCloseModal = () => {
    setPreviewImageIndex(null);
    setCurrentPost(null);
  };

  // 获取用户的帖子
  const getOwnPosts = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/ownPosts", {
        withCredentials: true,
      });
      setPosts(response.data.posts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getOwnPosts();
  }, []);

  useEffect(() => {
    if (!canScroll) return;
    const postsElement = postsRef.current;
    if (postsElement && canScroll) {
      postsElement.addEventListener("scroll", handleChildScroll);
    }
    return () => {
      if (postsElement && canScroll) {
        postsElement.removeEventListener("scroll", handleChildScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canScroll]);

  return (
    <div
      className={`${styles.ownPosts} ${canScroll ? styles.scrollable : ""}`}
      ref={postsRef}
    >
      {posts.length === 0 ? (
        <p>暂无帖子</p>
      ) : (
        <>
          {posts.map((post, index) => (
            <div
              key={post._id || index}
              className={styles.postItem}
              onClick={() => handlePostClick(post)} // 点击打开详情窗口
            >
              {post.isForwarded ? (
                <>
                  <p
                    style={{ whiteSpace: "pre-line" }}
                    className={`${styles.postContent} ${styles.clamped}`}
                  >
                    <i className="fi fi-rr-paper-plane"></i>
                    {post.originalPostContent ? (
                      <>
                        <br />
                        {post.originalPostContent}
                      </>
                    ) : (
                      <>
                        <br />
                        <span className={styles.unContent}>未编写内容</span>
                      </>
                    )}
                  </p>
                  {post.originalPostUrl && post.originalPostUrl.length > 0 && (
                    <div className={styles.imageGrid}>
                      {post.originalPostUrl.map((imageUrl, index) => (
                        <div className={styles.gridItem} key={index}>
                          <img
                            src={imageUrl}
                            className={styles.gridImage}
                            onClick={(e) => {
                              e.stopPropagation(); // 阻止事件冒泡
                              handleImageClick(index, post);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <small>
                    发布时间: {new Date(post.createdAt).toLocaleString()}
                  </small>
                </>
              ) : (
                <>
                  <p
                    style={{ whiteSpace: "pre-line" }}
                    className={`${styles.postContent} ${styles.clamped}`}
                  >
                    {post.content}
                  </p>
                  {post.url && post.url.length > 0 && (
                    <div className={styles.imageGrid}>
                      {post.url.map((imageUrl, index) => (
                        <div className={styles.gridItem} key={index}>
                          <img
                            src={imageUrl}
                            className={styles.gridImage}
                            onClick={(e) => {
                              e.stopPropagation(); // 阻止事件冒泡
                              handleImageClick(index, post);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <small>
                    发布时间: {new Date(post.createdAt).toLocaleString()}
                  </small>
                </>
              )}
            </div>
          ))}
          {previewImageIndex !== null && currentPost && (
            <ImagePreviewModal
              images={
                currentPost.isForwarded
                  ? currentPost.originalPostUrl
                  : currentPost.url
              }
              initialIndex={previewImageIndex}
              onClose={handleCloseModal}
            />
          )}
          {showPostDetail && currentPost && (
            <PostDetailModal
              post={currentPost} // 传递当前帖子
              onClose={handleClosePostDetail} // 关闭详情窗口
            />
          )}
        </>
      )}
    </div>
  );
}

export default OwnPosts;
