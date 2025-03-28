import styles from "./SearchBar.module.css";
import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const activeTab = "posts";

  const navigate = useNavigate(); // 使用 useNavigate 进行路由导航
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query !== "") {
      // 执行搜索逻辑，如获取搜索结果
      setIsSearched(() => true);
      navigate(
        `/explore/search/${activeTab}?query=${encodeURIComponent(query)}`
      );
    }
  };
  const handleClear = () => {
    setQuery("");
    setIsSearched(() => false);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(() => true);
  };

  const handleBlur = () => {
    setIsFocused(() => false);
  };

  // 点击推荐内容后将其填充到输入框
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion); // 将点击的推荐内容更新到输入框
    setIsSearched(() => true);
    navigate(
      `/explore/search/${activeTab}?query=${encodeURIComponent(suggestion)}`
    );
  };

  useEffect(() => {
    // 这里模拟获取搜索建议
    const simulatedSuggestions = ["建议1", "建议2", "建议3"];
    setSuggestions(simulatedSuggestions);
  }, []);

  return (
    <div className={styles.search_container}>
    <img src="/logo.png" alt="search" className={styles.search_icon} />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="搜索用户名、帖子内容或邮箱"
        className={`${styles.search_input}`}
        aria-label="搜索"
        autoComplete="off"
      />

      {query && (
        <button onClick={handleClear} className={`${styles.clear_button}`}>
          <i className="fi fi-sr-circle-trash"></i>
        </button>
      )}

      <div
        className={`${styles.search_suggestions} ${
          isFocused && !isSearched && suggestions.length > 0 ? styles.open : ""
        }`}
      >
        {suggestions.map((item, index) => (
          <div
            key={index}
            className={styles.suggestion_item}
            onMouseDown={() => handleSuggestionClick(item)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;
