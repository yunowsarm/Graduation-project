import styles from "./SearchBar.module.css";
import { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

function SearchBar() {
  const [query, setQuery] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const activeTab = "posts";
  const [isClickingSuggestion, setIsClickingSuggestion] = useState(false);

  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // 初始化历史记录
  useEffect(() => {
    const storedHistory =
      JSON.parse(localStorage.getItem("searchHistory")) || [];
    setHistory(storedHistory);
  }, []);

  const saveToHistory = (term) => {
    let newHistory = [term, ...history.filter((item) => item !== term)];
    if (newHistory.length > 5) newHistory = newHistory.slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query !== "") {
      setIsSearched(true);
      saveToHistory(query);
      navigate(
        `/explore/search/${activeTab}?query=${encodeURIComponent(query)}`
      );
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsSearched(false);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setTimeout(() => {
      if (!isClickingSuggestion) {
        setIsFocused(false);
      }
    }, 100);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setIsSearched(true);
    saveToHistory(suggestion);
    navigate(
      `/explore/search/${activeTab}?query=${encodeURIComponent(suggestion)}`
    );
  };

  const handleDeleteHistoryItem = (item) => {
    const newHistory = history.filter((h) => h !== item);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const suggestionsVisible = isFocused && !isSearched && history.length > 0;

  return (
    <div
      className={
        theme === "dark"
          ? styles.search_container
          : styles.search_containerLight
      }
    >
      <img
        src={theme === "dark" ? "/logo.png" : "/logoLight.png"}
        alt="search"
        className={styles.search_icon}
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="搜索用户名、帖子内容或邮箱"
        className={
          theme === "dark" ? styles.search_input : styles.search_inputLight
        }
        aria-label="搜索"
        autoComplete="off"
      />
      {query && (
        <button onClick={handleClear} className={styles.clear_button}>
          <i className="fi fi-sr-circle-trash"></i>
        </button>
      )}
      <div
        className={`${
          theme === "dark"
            ? styles.search_suggestions
            : styles.search_suggestionsLight
        } ${suggestionsVisible ? styles.open : ""}`}
      >
        {history.map((item, index) => (
          <div
            key={index}
            className={styles.suggestion_item}
            onMouseDown={() => setIsClickingSuggestion(true)} // 表示正在点击 suggestion
            onMouseUp={(e) => {
              setIsClickingSuggestion(false);
              if (!e.target.classList.contains(styles.delete_button)) {
                handleSuggestionClick(item);
              }
            }}
          >
            <span>{item}</span>
            <button
              className={styles.delete_button}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteHistoryItem(item);
              }}
            >
              ×
            </button>
          </div>
        ))}

        {history.length > 0 && (
          <div className={styles.clear_all} onMouseDown={clearAllHistory}>
            清除全部历史记录
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
