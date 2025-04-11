/* eslint-disable react/prop-types */
import styles from "./ActionBar.module.css";
import { useEffect, useState,useContext } from "react";
import axios from "axios";
import ForwardModal from "./normalPost_forwardPost/ForwardModal";
import { ThemeContext } from "../context/ThemeContext";
function ActionBar({ post, updateComments, fetchPosts }) {
  const [comments, setComments] = useState([]);
  const [viewNum, setViewNum] = useState(post.viewNum);
  const [likeNum, setLikeNum] = useState(post.likeNum);
  const [liked, setLiked] = useState(null); // 维护点赞状态
  const [forwardNum, setForwardNum] = useState(post.forwardNum);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const { theme } = useContext(ThemeContext);
  // const [originalPostUser, setOriginalPostUser] = useState({});

  useEffect(() => {
    if (!post) return;
  }, [post]);

  // 加载评论
  const loadComments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/comments/${post._id}`
      );
      setComments(response.data);
    } catch (err) {
      console.error("加载评论数量失败:", err);
    }
  };

  const loadView = async () => {
    if (!post) return;
    try {
      const response = await axios.get(
        `http://localhost:3001/views/${post._id}`
      );
      setViewNum(response.data.viewNum);
    } catch (err) {
      console.error("加载查看数量失败:", err);
    }
  };

  const addLike = async () => {
    if (!post) return;
    try {
      await axios.get(`http://localhost:3001/liked/add/${post._id}`, {
        withCredentials: true, // 确保发送 Cookie
      });
    } catch (err) {
      console.error(err);
    }
  };

  const removeLike = async () => {
    if (!post) return;
    try {
      await axios.get(`http://localhost:3001/liked/remove/${post._id}`, {
        withCredentials: true, // 确保发送 Cookie
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadLike = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/liked/${post._id}`,
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
      setLikeNum(response.data.likeNum);
      setLiked(response.data.liked);
    } catch (err) {
      console.error("加载喜欢数量或设置喜欢状态失败:", err);
    }
  };
  //没必要存在这个函数
  // const handelLoadLike = () => {
  //   setLiked(() => !liked);
  //   loadLike();
  // };

  const handleForwardClick = async () => {
    setShowForwardModal(true); // 打开转发模态框
    // try {
    //   await axios.post(
    //     `http://localhost:3001/posts/forward/${post._id}`,
    //     {}, // 请求体可以是空对象，因为你没有发送额外的内容
    //     {
    //       withCredentials: true, // 确保发送 Cookie
    //     }
    //   );
    //   loadForward(); // 加载更新后的转发数量
    // } catch (err) {
    //   console.error("转发失败:", err);
    // }
  };

  const handleForward = async (content) => {
    try {
      await axios.post(
        `http://localhost:3001/posts/forward/${post._id}`,
        { content },
        {
          withCredentials: true,
        }
      );
      loadForward(); // 更新转发数量
    } catch (err) {
      console.error("转发失败:", err);
    }
  };

  const loadForward = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3001/posts/forward/load/${post._id}`
      );
      setForwardNum(response.data.forwardNum);
    } catch (err) {
      console.error("加载转发数量失败:", err);
    }
  };

  const handleLikeClick = () => {
    if (!liked) {
      addLike();
      // handelLoadLike();
      loadLike();
    } else {
      removeLike();
      // handelLoadLike();感觉这个函数没必要存在
      loadLike();
    }
  };
  // const fetchoriginalPostUser = async (userId) => {
  //   try {
  //     const response = await axios.get(
  //       `http://localhost:3001/user/originalUser/${userId}`
  //     );
  //     setOriginalPostUser(response.data);
  //   } catch (error) {
  //     console.error(error);
  //     return null;
  //   }
  // };
  // 当组件加载时，更新视图次数并加载评论
  useEffect(() => {
    if (!post || !post._id) {
      return;
    }
    loadComments();
    loadView();
    loadLike();
    loadForward();
    // if (post.isForwarded) {
    //   fetchoriginalPostUser(post.originalPostAuthor);
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateComments, post]);

  return (
    <>
      <div className={theme === "dark" ? styles.postInfo : styles.postInfoLight}>
      <div className={theme === "dark" ? styles.icon : styles.iconLight} title="评论">
          <span className={theme === "dark" ? styles.iconColor : styles.iconColorLight}>
            <i className="fi fi-br-comment-alt"></i>{" "}
            <span>{comments.length}</span>
          </span>
        </div>
        <div className={theme === "dark" ? styles.icon : styles.iconLight} title="转发" onClick={handleForwardClick}>
          <span className={theme === "dark" ? styles.iconColor : styles.iconColorLight}>
            <i className="fi fi-br-paper-plane"></i> <span>{forwardNum}</span>
          </span>
        </div>
        <div
          className={theme === "dark" ? styles.icon : styles.iconLight} // 根据点赞状态设置样式
          title="点赞"
          onClick={handleLikeClick} // 添加点击事件
        >
          <span className={theme === "dark" ? styles.iconColor : styles.iconColorLight}>
            <i
              className={`${
                liked ? `fi fi-sr-heart ${styles.liked}` : "fi fi-br-heart"
              }`}
            />{" "}
            <span>{likeNum}</span>
          </span>
        </div>
        <div className={theme === "dark" ? styles.icon : styles.iconLight} title="查看">
          <span className={theme === "dark" ? styles.iconColor : styles.iconColorLight}>
            <i className="fi fi-br-overview"></i> <span>{viewNum}</span>
          </span>
        </div>
      </div>
      {/* 转发模态框 */}
      <ForwardModal
        show={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        post={post}
        onForward={handleForward}
        fetchPosts={fetchPosts}
      />
    </>
  );
}

export default ActionBar;
