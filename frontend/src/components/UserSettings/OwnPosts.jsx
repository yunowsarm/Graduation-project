/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import axios from "axios";
import { useEffect, useState, useRef, useContext } from "react";
import styles from "./OwnPosts.module.css";
import ImagePreviewModal from "../ImagePreviewModal";
import PostDetailModal from "./PostDetailModal";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import { ThemeContext } from "../../context/ThemeContext";

function OwnPosts({ canScroll, setCanParentScroll }) {
  const [posts, setPosts] = useState([]);
  const postsRef = useRef(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null); // 当前待删除的帖子
  const { theme } = useContext(ThemeContext);
  const postsElement = postsRef.current;

  // 获取帖子
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

  // 删除帖子
  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:3001/posts/delete/${postId}`, {
        withCredentials: true,
      });
      getOwnPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // 控制父组件滚动
  const handleChildScroll = () => {
    if (postsElement) {
      setCanParentScroll(postsElement.scrollTop === 0);
    }
  };

  useEffect(() => {
    getOwnPosts();
  }, []);

  useEffect(() => {
    if (!canScroll) return;
    if (postsElement) {
      postsElement.addEventListener("scroll", handleChildScroll);
    }
    return () => {
      if (postsElement) {
        postsElement.removeEventListener("scroll", handleChildScroll);
      }
    };
  }, [canScroll]);

  // 打开详情
  const handlePostClick = (post) => {
    if (postsElement?.scrollTop === 0) {
      setCanParentScroll(false);
    }
    setCurrentPost(post);
    setShowPostDetail(true);
  };

  // 关闭详情
  const handleClosePostDetail = () => {
    if (postsElement?.scrollTop === 0) {
      setCanParentScroll(true);
    }
    setCurrentPost(null);
    setShowPostDetail(false);
  };

  // 预览图片
  const handleImageClick = (index, post) => {
    setPreviewImageIndex(index);
    setCurrentPost(post);
  };

  const handleCloseModal = () => {
    setPreviewImageIndex(null);
    setCurrentPost(null);
  };

  return (
    <div
      className={`${
        theme === "dark" ? styles.ownPosts : styles.ownPostsLight
      } ${canScroll ? styles.scrollable : ""}`}
      ref={postsRef}
    >
      {posts.length === 0 ? (
        <p>暂无帖子</p>
      ) : (
        <>
          {posts.map((post, index) => (
            <div
              key={post._id || index}
              className={
                theme === "dark" ? styles.postItem : styles.postItemLight
              }
              onClick={() => handlePostClick(post)}
            >
              <i
                className="fi fi-br-trash"
                onClick={(e) => {
                  e.stopPropagation();
                  setPostToDelete(post);
                }}
              ></i>
              {post.isForwarded ? (
                <>
                  <p
                    style={{ whiteSpace: "pre-line" }}
                    className={`${
                      theme === "dark"
                        ? styles.postContent
                        : styles.postContentLight
                    } ${styles.clamped}`}
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
                  {post.originalPostUrl?.length > 0 && (
                    <div className={styles.imageGrid}>
                      {post.originalPostUrl.map((imageUrl, index) => (
                        <div className={styles.gridItem} key={index}>
                          <img
                            src={imageUrl}
                            className={styles.gridImage}
                            onClick={(e) => {
                              e.stopPropagation();
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
                    className={`${
                      theme === "dark"
                        ? styles.postContent
                        : styles.postContentLight
                    } ${styles.clamped}`}
                  >
                    {post.content}
                  </p>
                  {post.url?.length > 0 && (
                    <div className={styles.imageGrid}>
                      {post.url.map((imageUrl, index) => (
                        <div className={styles.gridItem} key={index}>
                          <img
                            src={imageUrl}
                            className={styles.gridImage}
                            onClick={(e) => {
                              e.stopPropagation();
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

          {/* 全局图片预览 */}
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

          {/* 帖子详情弹窗 */}
          {showPostDetail && currentPost && (
            <PostDetailModal
              post={currentPost}
              onClose={handleClosePostDetail}
            />
          )}

          {/* 删除确认弹窗（全局唯一） */}
          {postToDelete && (
            <ConfirmModal
              isOpen={!!postToDelete}
              onConfirm={() => {
                handleDeletePost(postToDelete._id);
                setPostToDelete(null);
              }}
              onCancel={() => setPostToDelete(null)}
              message={"您确定要删除该帖子吗？"}
            />
          )}
        </>
      )}
    </div>
  );
}

export default OwnPosts;
