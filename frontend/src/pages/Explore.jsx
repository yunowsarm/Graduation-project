import SearchBar from "../components/Search/SearchBar";
import { Outlet } from "react-router-dom";

function Explore() {
  return (
    <div>
      <SearchBar />
      <Outlet /> {/* 子路由会渲染在这里 */}
    </div>
  );
}

export default Explore;
