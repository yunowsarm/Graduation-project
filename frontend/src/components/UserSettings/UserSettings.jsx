import { useState, useEffect, useRef, useContext } from "react";
import Modal from "./Modal";
import OwnPosts from "./OwnPosts";
import styles from "./UserSettings.module.css";
import axios from "axios";
import OwnLikes from "./OwnLikes";
import OwnFollow from "./OwnFollow";
import { ThemeContext } from "../../context/ThemeContext";

const UserSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [profileData, setProfileData] = useState({
    username: "",
    avatar: "",
    email: "",
    createdAt: "",
    sign: "",
  });
  const [canChildScroll, setCanChildScroll] = useState(false); // 控制子页面滚动
  const [canParentScroll, setCanParentScroll] = useState(true); // 控制父页面滚动
  const parentRef = useRef(null);
  const { theme } = useContext(ThemeContext);
  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/me", {
        withCredentials: true,
      });
      setProfileData({
        username: response.data.username,
        avatar: response.data.avatar,
        email: response.data.email,
        createdAt: response.data.createdAt,
        sign: response.data.sign,
        id: response.data.id,
      });
    } catch (error) {
      console.error("获取用户失败:", error);
    }
  };

  const updateUser = async (newProfileData) => {
    try {
      await axios.put(
        "http://localhost:3001/user/update",
        {
          username: newProfileData.username,
          sign: newProfileData.sign,
          avatar: newProfileData.avatar,
        },
        {
          withCredentials: true, // 确保发送 Cookie
        }
      );
      await fetchUser(); // 更新完成后重新获取用户信息
    } catch (error) {
      console.error("获取用户失败:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // 处理父容器滚动事件
  const handleParentScroll = () => {
    const parent = parentRef.current;
    if (parent && canParentScroll) {
      const isScrolledToBottom =
        Math.abs(parent.scrollTop + parent.clientHeight - parent.scrollHeight) <
        1;
      setCanChildScroll(isScrolledToBottom); // 更新是否允许子容器滚动
    }
  };

  // 鼠标滚轮事件，直接滚动到底部或顶部
  const handleWheelScroll = (event) => {
    const parent = parentRef.current;
    if (parent) {
      const newScrollTop =
        event.deltaY > 0
          ? parent.scrollHeight // 滚动到底部
          : 0; // 滚动到顶部
      parent.scrollTo({
        top: newScrollTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const parent = parentRef.current;
    if (parent && canParentScroll) {
      // 监听滚动事件
      parent.addEventListener("scroll", handleParentScroll);
      parent.addEventListener("wheel", handleWheelScroll, { passive: false });
    }
    return () => {
      if (parent && canParentScroll) {
        parent.removeEventListener("scroll", handleParentScroll);
        parent.removeEventListener("wheel", handleWheelScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canParentScroll]);

  return (
    <div
      className={
        theme === "dark"
          ? styles.profile_container
          : styles.profile_containerLight
      }
      ref={parentRef}
    >
      <div className={styles.header} />
      <div className={styles.banner}></div>
      <div
        className={
          theme === "dark"
            ? styles.profile_section
            : styles.profile_sectionLight
        }
      >
        <div
          className={
            theme === "dark"
              ? styles.avatar_container
              : styles.avatar_containerLight
          }
        >
          <img
            src={profileData.avatar}
            alt="avatar"
            className={styles.avatar}
          />
        </div>
        <div
          className={
            theme === "dark" ? styles.profile_info : styles.profile_infoLight
          }
        >
          <h2>{profileData.username}</h2>
          <p>
            {profileData.sign ? profileData.sign : "这个人很神秘，什么都没有写"}
          </p>
          <p>{profileData.email}</p>
          <p>{profileData.createdAt}加入</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.edit_button}
        >
          编辑个人资料
        </button>
      </div>
      <div className={styles.tabs}>
        <span
          className={`${theme == "dark" ? styles.tab : styles.tabLight} ${
            activeTab === "posts" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("posts")}
        >
          帖子
        </span>
        <span
          className={`${theme == "dark" ? styles.tab : styles.tabLight} ${
            activeTab === "following" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("following")}
        >
          关注
        </span>
        <span
          className={`${theme == "dark" ? styles.tab : styles.tabLight} ${
            activeTab === "likes" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("likes")}
        >
          喜欢
        </span>
      </div>

      {/* 根据 activeTab 条件渲染内容 */}
      {activeTab === "posts" && (
        <OwnPosts
          canScroll={canChildScroll}
          setCanParentScroll={setCanParentScroll}
          canParentScroll={canParentScroll}
        />
      )}
      {activeTab === "following" && (
        <OwnFollow
          canScroll={canChildScroll}
          setCanParentScroll={setCanParentScroll}
          canParentScroll={canParentScroll}
          currectUser={profileData}
        />
      )}
      {activeTab === "likes" && (
        <OwnLikes
          canScroll={canChildScroll}
          setCanParentScroll={setCanParentScroll}
          canParentScroll={canParentScroll}
        />
      )}

      {/* 模态窗口 */}
      {isModalOpen && (
        <Modal
          profileData={profileData}
          onClose={() => setIsModalOpen(false)}
          onUpdate={(updatedData) => {
            const newProfileData = { ...profileData, ...updatedData };
            setProfileData(newProfileData);
            updateUser(newProfileData);
          }}
        />
      )}
    </div>
  );
};

export default UserSettings;
