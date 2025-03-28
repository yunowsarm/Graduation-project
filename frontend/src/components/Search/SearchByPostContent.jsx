/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import styles from "./SearchByPostContent.module.css";
import ForwardPost from "../normalPost_forwardPost/ForwardPost";
import NormalPost from "../normalPost_forwardPost/NormalPost";
import ImagePreviewModal from "../ImagePreviewModal";
import { useState } from "react";
function SearchByPostContent({ posts = [] }) {
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null); //和要点击后预览的图片有关
  const handleContextMenu = (e) => {
    e.preventDefault(); // 禁用右键菜单
  };
  const handlePostClick = (e, post) => {
    // 如果是右键单击，直接返回
    if (e.button !== 0) return;

    // 如果用户选择了文字，不触发跳转
    const selection = window.getSelection();
    if (selection && selection.type === "Range") return;

    // 如果点击的不是图片或 ActionBar，才执行跳转
    if (!e.target.closest("img") && !e.target.closest(`.${styles.actionBar}`)) {
      console.log(currentPost);
    }
  };
  //关闭预览图片
  const handleCloseModal = () => {
    setPreviewImageIndex(null);
    setCurrentPost(null);
  };
  return (
    <>
      {Array.isArray(posts) &&
        posts.map((post, index) => (
          <div className={styles.container} key={index}>
            {post.isForwarded ? (
              <ForwardPost
                post={post}
                handleContextMenu={handleContextMenu}
                handlePostClick={handlePostClick}
                setPreviewImageIndex={setPreviewImageIndex}
                setCurrentPost={setCurrentPost}
              />
            ) : (
              <NormalPost
                post={post}
                handleContextMenu={handleContextMenu}
                handlePostClick={handlePostClick}
                setPreviewImageIndex={setPreviewImageIndex}
                setCurrentPost={setCurrentPost}
              />
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
    </>
  );
}

export default SearchByPostContent;
