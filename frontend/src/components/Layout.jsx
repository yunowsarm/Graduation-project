import RecommendBar from "../components/RecommendBar";
import styles from "../pages/TotalLayout.module.css";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
//暂时无用
function Layout() {
  return (
    <div className={styles.pageContainer}>
      <SideBar />
      <Outlet /> {/* 子路由将在这里渲染 */}
      <RecommendBar />
    </div>
  );
}

export default Layout;
