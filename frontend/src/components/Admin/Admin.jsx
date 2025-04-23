import { useState, useEffect, useContext } from "react";
import styles from "./Admin.module.css";
import axios from "axios";
import { ThemeContext } from "../../context/ThemeContext";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
function Admin() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // 每页显示 10 个用户
  const { theme } = useContext(ThemeContext);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currectUserId, setCurrectUserId] = useState("");
  const [currectUserState, setCurrectUserState] = useState("");

  const getAllUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user/allUsers");
      console.log(response.data);
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  // 模拟从后端获取数据
  useEffect(() => {
    getAllUsers();
  }, []);

  // 过滤用户数据
  const filteredUsers = users.filter(
    (user) =>
      (user.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  // 分页处理
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // 计算总页数
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // 搜索框改变事件
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // 搜索时重置为第一页
  };

  // 改变页码
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const freezeUser_unFreezeUser = async (userId, currentState) => {
    try {
      if (currentState === "active") {
        await axios.put(`http://localhost:3001/user/freeze/${userId}`);
      } else {
        await axios.put(`http://localhost:3001/user/unfreeze/${userId}`);
      }
    } catch (error) {
      console.error("error");
    } finally {
      setShowModal(false);
      getAllUsers(); // ✅ 更新前端状态
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await axios.delete(
        `http://localhost:3001/user/delete/${userId}`
      );
      console.log(res.data.message);
    } catch (error) {
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      getAllUsers(); // ✅ 更新前端状态
    }
  };

  const handleFreezeUser = (userId, currentState) => {
    setShowModal(true);
    setCurrectUserId(userId);
    setCurrectUserState(currentState);
  };

  const handleDeleteUser = (userId) => {
    setShowDeleteModal(true);
    setCurrectUserId(userId);
  };

  return (
    <div>
      <div
        className={theme === "dark" ? styles.ContainerLight : styles.Container}
      >
        {/* 搜索框 */}
        <div
          className={
            theme === "dark"
              ? styles.SearchContainerLight
              : styles.SearchContainer
          }
        >
          <input
            type="text"
            className={
              theme === "dark" ? styles.SearchInputLight : styles.SearchInput
            }
            value={search}
            onChange={handleSearchChange}
          />
          <i className="fi fi-br-trash" onClick={() => setSearch("")}></i>
        </div>

        {/* 表格区域 */}
        <div className={styles.TableWrapper}>
          <table
            className={theme === "dark" ? styles.TableLight : styles.Table}
          >
            <thead>
              <tr>
                <th>用户</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.state}</td>
                  <td>
                    <button
                      className={
                        theme === "dark" ? styles.ButtonLight : styles.Button
                      }
                      style={{
                        backgroundColor:
                          user.state === "active" ? "#007bff" : "#6c757d", // 蓝色 vs 灰色
                      }}
                      onClick={() => handleFreezeUser(user._id, user.state)}
                    >
                      {user.state === "active" ? "冻结" : "解除"}
                    </button>
                    <button
                      className={
                        theme === "dark" ? styles.ButtonLight : styles.Button
                      }
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div
        className={
          theme === "dark"
            ? styles.PaginationContainerLight
            : styles.PaginationContainer
        }
      >
        <div
          className={
            theme === "dark" ? styles.PaginationLight : styles.Pagination
          }
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={
              theme === "dark" ? styles.NextButtonLight : styles.NextButton
            }
          >
            上一页
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={
                currentPage === index + 1
                  ? theme === "dark"
                    ? styles.ActivePageLight
                    : styles.ActivePage
                  : theme === "dark"
                  ? styles.unActivePageLight
                  : styles.unActivePage
              }
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={
              theme === "dark" ? styles.NextButtonLight : styles.NextButton
            }
          >
            下一页
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={showModal}
        onConfirm={() =>
          freezeUser_unFreezeUser(currectUserId, currectUserState)
        }
        onCancel={() => setShowModal(false)}
        message={
          currectUserState === "active"
            ? "你确定要冻结该用户吗？"
            : "你确定要解冻该用户吗？"
        }
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={() => deleteUser(currectUserId)}
        onCancel={() => setShowDeleteModal(false)}
        message={"你确定要删除该用户吗？"}
      />
    </div>
  );
}

export default Admin;
