/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import styles from "./Content.module.css";
import Textarea from "./Textarea";
import Post from "./Post";
import axios from "axios";

function Content() {
  const [posts, setPosts] = useState([]); // 用于存储后端返回的数据
  const [isLoading, setIsLoading] = useState(true); // 用于控制加载状态
  // const [selectedPost, setSelectedPost] = useState(null); // 用于存储选中的帖子
  // const [scrollPosition, setScrollPosition] = useState(0); // 保存滚动位置
  // const [isButtonVisible, setIsButtonVisible] = useState(false); // 控制按钮显示
  const outerLayerRef = useRef(null);
  const [isButtonVisible, setIsButtonVisible] = useState(false);

  useEffect(() => {
    const position = sessionStorage.getItem("scrollPosition");
    if (position) {
      outerLayerRef.current.scrollTo(0, parseInt(position, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/Content/loadContent"
      );
      setPosts(response.data); // 保存数据到 state
      setIsLoading(false); // 加载完成
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  // const addViews = async (post) => {
  //   try {
  //     await axios.get(`http://localhost:3001/views/add/${post._id}`);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const handleScroll = () => {
  //   if (scrollContainerRef.current) {
  //     const scrollTop = scrollContainerRef.current.scrollTop;
  //     setIsButtonVisible(scrollTop > 600); // 页面滚动超过 600px 时显示按钮
  //   }
  // };

  useEffect(() => {
    // 获取数据
    fetchPosts();

    // const scrollContainer = scrollContainerRef.current;
    // if (scrollContainer) {
    //   scrollContainer.addEventListener("scroll", handleScroll);
    // }

    // return () => {
    //   if (scrollContainer) {
    //     scrollContainer.removeEventListener("scroll", handleScroll);
    //   }
    // };
  }, []);
  const handleScroll = () => {
    if (outerLayerRef.current) {
      const scrollTop = outerLayerRef.current.scrollTop;
      setIsButtonVisible(scrollTop > 600); // 页面滚动超过 600px 时显示按钮
      sessionStorage.setItem("scrollPosition", outerLayerRef.current.scrollTop);
    }
  };

  useEffect(() => {
    const scrollContainer = outerLayerRef.current;

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }
    //组件移除时，移除事件监听器
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.content} ref={outerLayerRef}>
      <Textarea
        fetchPosts={fetchPosts}
        setIsLoading={setIsLoading}
        outerLayerRef={outerLayerRef}
      />
      <Post posts={posts} isLoading={isLoading}  fetchPosts={fetchPosts}/>
      {/* 返回顶部按钮 */}
      {isButtonVisible && (
        <button
          onClick={() => {
            outerLayerRef.current.scrollTo({
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

export default Content;
