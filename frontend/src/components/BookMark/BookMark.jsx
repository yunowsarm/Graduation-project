import axios from "axios";
import { useState, useEffect } from "react";
import NormalPost from "../normalPost_forwardPost/NormalPost";
import ForwardPost from "../normalPost_forwardPost/ForwardPost";
import ImagePreviewModal from "../ImagePreviewModal";
import styles from './BookMark.module.css'
function BookMark() {
  const [posts, setPosts] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
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
    <div className={styles.bookMark}>
      {posts.map((post, index) => (
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

export default BookMark;
