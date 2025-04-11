/* eslint-disable react/prop-types */
import { useState } from "react";
import ImagePreviewModal from "./ImagePreviewModal";
import ForwardPost from "./normalPost_forwardPost/ForwardPost";
import NormalPost from "./normalPost_forwardPost/NormalPost";
function Post({ posts, isLoading, fetchPosts }) {
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  // useEffect(() => {
  //   // 恢复滚动位置
  //   const savedPosition = sessionStorage.getItem("scrollPosition");
  //   console.log(savedPosition)
  //   if (savedPosition) {
  //     window.scrollTo(0, parseInt(savedPosition, 10));
  //   }
  // }, []);

  const handleCloseModal = () => {
    setPreviewImageIndex(null);
    setCurrentPost(null);
  };

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (isLoading) {
    return <div></div>;
  }

  // const handlePostClick = (e, post) => {
  //   // 如果是右键单击，直接返回
  //   if (e.button !== 0) return;

  //   // 如果用户选择了文字，不触发跳转
  //   const selection = window.getSelection();
  //   if (selection && selection.type === "Range") return;

  //   // 如果点击的不是图片或 ActionBar，才执行跳转
  //   if (!e.target.closest("img") && !e.target.closest(`.${styles.actionBar}`)) {
  //     onPostClick(post);
  //   }
  // };
  // 禁用右键菜单
  const handleContextMenu = (e) => {
    e.preventDefault(); // 禁用右键菜单
  };
  return (
    <>
      {sortedPosts.map((post, index) => (
        <div key={post._id || index}>
          {post.isForwarded ? (
            <ForwardPost
              fetchPosts={fetchPosts}
              post={post}
              handleContextMenu={handleContextMenu}
              setPreviewImageIndex={setPreviewImageIndex}
              setCurrentPost={setCurrentPost}
            />
          ) : (
            <NormalPost
              fetchPosts={fetchPosts}
              post={post}
              handleContextMenu={handleContextMenu}
              setPreviewImageIndex={setPreviewImageIndex}
              setCurrentPost={setCurrentPost}
            />
          )}
        </div>
        /* 提取为ForwardPost */
        /* <div
          className={styles.post}
          key={post._id || index}
          onContextMenu={handleContextMenu} // 局部禁用右键
          onMouseUp={(e) => handlePostClick(e, post)} // 用 MouseUp 避免干扰选择事件
        >
          <div className={styles.postHeader}>
            <div className={styles.userInfo}>
              <img
                src={post.avatar}
                className={styles.avatar}
              />
              <strong className={styles.userName}>{post.name}</strong>
            </div>
            <span className={styles.postTime}>{formatDate(post.createdAt)}</span>
          </div>
          <p style={{ whiteSpace: "pre-line" }} className={styles.postContent}>
            {post.content}
          </p>
          {post.url.length > 0 && (
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
          <div
            className={`${styles.actionBar}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ActionBar post={post} />
          </div>
        </div> */
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
    </>
  );
}

export default Post;
