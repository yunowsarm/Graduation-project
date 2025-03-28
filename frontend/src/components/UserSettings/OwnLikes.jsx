/* eslint-disable react/prop-types */
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import NormalPost from "../normalPost_forwardPost/NormalPost";
import ForwardPost from "../normalPost_forwardPost/ForwardPost";
import ImagePreviewModal from "../ImagePreviewModal";
import styles from "./OwnLikes.module.css";
function OwnLikes({ canScroll, setCanParentScroll }) {
  const [posts, setPosts] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const postsRef = useRef(null);
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

  const getOwnLikes = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/likePosts", {
        withCredentials: true,
      });
      setPosts(response.data.posts);
      console.log(response.data.posts, response.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/Content/loadContent"
      );
      setPosts(response.data); // 保存数据到 state
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault(); // 禁用右键菜单
  };

  const handleCloseModal = () => {
    setPreviewImageIndex(null);
    setCurrentPost(null);
  };

  useEffect(() => {
    getOwnLikes();
  }, []);
  return (
    <div
      className={`${styles.ownPosts} ${canScroll ? styles.scrollable : ""}`}
      ref={postsRef}
    >
      {posts.map((post, index) => (
        <div key={post._id || index} className={styles.postItem}>
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
    </div>
  );
}

export default OwnLikes;
