import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import SearchByPostContent from "../components/Search/SearchByPostContent";
import { useState, useEffect } from "react";
import styles from "../pages/TotalLayout.module.css";
import SearchByUsername from "../components/Search/SearchByUsername";
import SearchByEmail from "../components/Search/SearchByEmail";
import { useNavigate } from "react-router-dom";

function SearchResults() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query"));
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(type || "posts");
  const [isSearched, setIsSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    handleSearch(query);
    setTimeout(() => {
      setIsSearched(true);
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    // 这里模拟获取搜索建议
    const simulatedSuggestions = ["建议1", "建议2", "建议3"];
    setSuggestions(simulatedSuggestions);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/explore/search/${tab}?query=${encodeURIComponent(query)}`);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query !== "") {
      // 执行搜索逻辑，如获取搜索结果
      setIsSearched(() => true);
      handleSearch(query);
      linkTo(query);
    }
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

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion); // 将点击的推荐内容更新到输入框
    setIsSearched(() => true);
    handleSearch(suggestion);
    linkTo(suggestion);
  };

  return (
    <div className={styles.search_container}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="搜索用户名、帖子内容或邮箱"
        className={styles.search_input}
        aria-label="搜索"
        autoComplete="off"
      />

      {query && (
        <button onClick={handleClear} className={styles.clear_button}>
          <i className="fi fi-sr-circle-trash"></i>
        </button>
      )}

      <div
        className={`${styles.search_suggestions} ${
          isFocused && suggestions.length > 0 ? styles.open : ""
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

      <div className={`${styles.search_tabs} ${isSearched ? styles.show : ""}`}>
        <span
          className={`${styles.search_tab} ${
            activeTab === "posts" ? styles.active : ""
          }`}
          onClick={() => handleTabChange("posts")}
        >
          帖子
        </span>
        <span
          className={`${styles.search_tab} ${
            activeTab === "users" ? styles.active : ""
          }`}
          onClick={() => handleTabChange("users")}
        >
          用户
        </span>
        <span
          className={`${styles.search_tab} ${
            activeTab === "emails" ? styles.active : ""
          }`}
          onClick={() => handleTabChange("emails")}
        >
          邮箱
        </span>
      </div>

      <div
        className={`${styles.search_content} ${isSearched ? styles.show : ""}`}
      >
        {!results ? (
          <p className={styles.no_results}>没有找到相关内容</p>
        ) : (
          <>
            {activeTab === "posts" && <SearchByPostContent posts={results} />}
            {activeTab === "users" && <SearchByUsername users={results} />}
            {activeTab === "emails" && <SearchByEmail emails={results} />}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
