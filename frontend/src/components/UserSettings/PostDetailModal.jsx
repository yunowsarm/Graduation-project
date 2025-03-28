/* eslint-disable react/prop-types */
import styles from "./PostDetailModal.module.css";
import { useState, useEffect } from "react";
import ImagePreviewModal from "../ImagePreviewModal";
import axios from "axios";
function PostDetailModal({ post, onClose }) {
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [originalPostUser, setOriginalPostUser] = useState({}); //最原始帖子信息
  const [deepPost, setDeepPost] = useState({});
  const handleImageClick = (index, post) => {
    setPreviewImageIndex(index);
    setCurrentPost(post);
  };
  const handleCloseModal = () => {
    setPreviewImageIndex(null);
    setCurrentPost(null);
  };

  //加载最原始帖子的信息
  const loadDeepPost = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/posts/forward/deepPosts/${post._id}`
      );
      const originalPost = response.data.originalPost;

      setDeepPost(originalPost);

      try {
        const resOriginalUser = await axios.get(
          `http://localhost:3001/user/originalUser/${originalPost.originalPostAuthor}`
        );
        setOriginalPostUser(resOriginalUser.data);
      } catch (error) {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3001/comments/${post._id}`
      );
      setComments(response.data);
    } catch (err) {
      setError("加载评论失败，请稍后重试。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  // 加载评论
  useEffect(() => {
    loadComments();
    if (post.isForwarded) {
      loadDeepPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalWrapper}>
        <div className={styles.modalContent}>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
          {post.isForwarded ? (
            <>
              <p
                style={{ whiteSpace: "pre-line" }}
                className={styles.postContent}
              >
                {post.originalPostContent||<span style={{opacity:0.2}}>未编写内容</span>}
              </p>
              {post.originalPostUrl && post.originalPostUrl.length > 0 && (
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

              <span className={styles.icon}>
                {" "}
                <i className="fi fi-rr-paper-plane"></i><span className={styles.iconText}>转载自:</span>
              </span>
              <div className={styles.post}>
                <div className={styles.postHeader}>
                  <div className={styles.userInfo}>
                    <img
                      src={originalPostUser.avatar}
                      className={styles.avatar}
                    />
                    <strong className={styles.userName}>
                      {originalPostUser.username}
                    </strong>
                  </div>
                  {/* 原始帖子的postTime */}
                  <span className={styles.postTime}>
                    发布时间:{" "}
                    {new Date(deepPost.originalPostCreatedAt).toLocaleString()}
                  </span>
                </div>
                {/* 原始帖子的postContent */}
                <div>
                  <p
                    style={{ whiteSpace: "pre-line" }}
                    className={styles.forwardPostContent}
                  >
                    {deepPost.originalPostContent}
                  </p>
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
          ) : (
            <>
              <p
                style={{ whiteSpace: "pre-line" }}
                className={styles.postContent}
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
      </div>
      {/* 评论部分 */}
      <div className="container">
        <div className={styles.mainContent}>{/* 主内容 */}</div>
        <div className={styles.commentSection}>
          {isLoading && <p>加载中...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {comments.length > 0 ? (
            <div className={styles.commentList}>
              {comments.map((comment, index) => (
                <div key={index} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <img
                      src={comment.authorInfo.avatar}
                      alt={`${comment.author.username}的头像`}
                      className={styles.commentAvatar}
                    />
                    <strong className={styles.commentUsername}>
                      {comment.authorInfo.username}
                    </strong>
                  </div>
                  <p className={styles.commentContent}>{comment.content}</p>
                  <span className={styles.commentTime}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>暂无评论</p>
          )}
        </div>
      </div>

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
    </div>
  );
}

export default PostDetailModal;
