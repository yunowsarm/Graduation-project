import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi"; // 太阳 & 月亮图标
import "./ThemeToggle.css"; // 导入样式

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="toggle-container" onClick={toggleTheme}>
      <div className={`toggle-slider ${theme === "dark" ? "dark-mode" : ""}`}>
        {theme === "light" ? <FiSun className="icon sun" /> : <FiMoon className="icon moon" />}
      </div>
    </div>
  );
}

export default ThemeToggle;
