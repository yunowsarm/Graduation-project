import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import SearchByPostContent from "../components/Search/SearchByPostContent";
import { useState, useEffect, useContext } from "react";
import styles from "../pages/TotalLayout.module.css";
import SearchByUsername from "../components/Search/SearchByUsername";
import SearchByEmail from "../components/Search/SearchByEmail";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

function SearchResults() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query"));
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(type || "posts");
  const [isSearched, setIsSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [history, setHistory] = useState([]);

  const handleSearch = async (query) => {
    try {
      let response = {}; // 预设默认数据为空数组
      if (activeTab === "posts") {
        response = await axios.post(
          "http://localhost:3001/search/searchByPostContent",
          { query }
        );
      } else if (activeTab === "users") {
        response = await axios.post(
          "http://localhost:3001/search/searchByUsername",
          { query }
        );
      } else if (activeTab === "emails") {
        response = await axios.post(
          "http://localhost:3001/search/searchByEmail",
          { query }
        );
      }
      setResults(response.data.results); // 确保 `results` 是数组
    } catch (error) {
      console.error("搜索失败:", error);
      setResults(null); // 发生错误时，`results` 设为空数组
    }
  };

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
      handleSearch(query);
      linkTo(query);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setIsSearched(true);
    saveToHistory(suggestion);
    handleSearch(suggestion);
    linkTo(suggestion);
  };

  useEffect(() => {
    handleSearch(query);
    setTimeout(() => {
      setIsSearched(true);
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/explore/search/${tab}?query=${encodeURIComponent(query)}`);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const linkTo = (query) => {
    navigate(`/explore/search/${activeTab}?query=${encodeURIComponent(query)}`);
  };

  const handleFocus = () => {
    setIsFocused(() => true);
  };

  const handleBlur = () => {
    setIsFocused(() => false);
  };

  const handleClear = () => {
    setQuery("");
    setIsSearched(() => false);
    navigate("/explore");
  };

  return (
    <div
      className={
        theme === "dark"
          ? styles.search_container
          : styles.search_containerLight
      }
    >
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
        <button
          onClick={handleClear}
          className={
            theme === "dark" ? styles.clear_button : styles.clear_buttonLight
          }
        >
          <i className="fi fi-sr-circle-trash"></i>
        </button>
      )}

      <div
        className={`${
          theme === "dark"
            ? styles.search_suggestions
            : styles.search_suggestionsLight
        } ${isFocused && history.length > 0 ? styles.open : ""}`}
      >
        {history.map((item, index) => (
          <div
            key={index}
            className={styles.suggestion_item}
            onMouseDown={() => handleSuggestionClick(item)}
          >
            {item}
          </div>
        ))}
      </div>

      <div className={`${styles.search_tabs} ${isSearched ? styles.show : ""}`}>
        <span
          className={`${
            theme === "dark" ? styles.search_tab : styles.search_tabLight
          } ${activeTab === "posts" ? styles.active : ""}`}
          onClick={() => handleTabChange("posts")}
        >
          帖子
        </span>
        <span
          className={`${
            theme === "dark" ? styles.search_tab : styles.search_tabLight
          } ${activeTab === "users" ? styles.active : ""}`}
          onClick={() => handleTabChange("users")}
        >
          用户
        </span>
        <span
          className={`${
            theme === "dark" ? styles.search_tab : styles.search_tabLight
          } ${activeTab === "emails" ? styles.active : ""}`}
          onClick={() => handleTabChange("emails")}
        >
          邮箱
        </span>
      </div>

      <div
        className={`${styles.search_content} ${isSearched ? styles.show : ""}`}
      >
        {!results ? (
          <p
            className={
              theme === "dark" ? styles.no_results : styles.no_resultsLight
            }
          >
            没有找到相关内容
          </p>
        ) : (
          <>
            {activeTab === "posts" && <SearchByPostContent posts={results} />}
            {activeTab === "users" && <SearchByUsername users={results} />}
            {activeTab === "emails" && <SearchByEmail email={results} />}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
