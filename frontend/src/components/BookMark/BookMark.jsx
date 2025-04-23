import axios from "axios";
import { useState, useEffect, useContext } from "react";
import NormalPost from "../normalPost_forwardPost/NormalPost";
import ForwardPost from "../normalPost_forwardPost/ForwardPost";
import ImagePreviewModal from "../ImagePreviewModal";
import styles from "./BookMark.module.css";
import { ThemeContext } from "../../context/ThemeContext";
function BookMark() {
  const [posts, setPosts] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const { theme } = useContext(ThemeContext);
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
    <div className={theme === "dark" ? styles.bookMark : styles.bookMarkLight}>
      {posts.length > 0 ? (
        posts.map((post, index) => (
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
        ))
      ) : (
        <p className={theme === "dark" ? styles.noLikes : styles.noLikesLight}>
          暂无收藏或点赞
        </p>
      )}
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
