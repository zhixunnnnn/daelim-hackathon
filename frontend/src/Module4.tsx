import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Search, X } from "lucide-react";
import { logAnalysis } from "./utils/analytics";
import GlossaryModal from "./components/GlossaryModal";
import { errorHandler } from "./utils/errorHandler";

interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  shortDefinition: string;
  detailedDefinition: string;
  useCases: string[];
  relatedTerms: string[];
  matchScore?: number;
}

const Module4 = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load initial terms
  useEffect(() => {
    loadTerms();
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTerms(searchQuery, selectedCategory);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const loadTerms = async (query = "", category = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (category) params.append("category", category);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/api/glossary/search?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setTerms(data.terms || []);
        if (data.categories) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      errorHandler.handleNetworkError(error, { operation: "loadTerms", query, category });
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTermClick = async (term: GlossaryTerm) => {
    setSelectedTerm(term);
    setIsModalOpen(true);

    // Log analytics
    logAnalysis("glossary", `Viewed term: ${term.term}`);
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
    } else {
      setSelectedCategory(category);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  return (
    <div className="module2-container">
      <header className="header">
        <div className="header-content">
          <div className="breadcrumb">
            <span className="breadcrumb-item">{t("breadcrumb.workspace")}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {t("breadcrumb.glossary")}
            </span>
          </div>
          <div className="header-title">
            <h1>{t("module4.title")}</h1>
            <p>{t("module4.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="content">
        {/* Search Bar */}
        <div className="glossary-search-container">
          <div className="glossary-search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="glossary-search-input"
              placeholder={t("module4.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {(searchQuery || selectedCategory) && (
              <button
                className="clear-search-btn"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="category-chips-container">
            <div className="category-chips">
              {categories.map((category) => {
                const categoryKey = String(category).toLowerCase();
                const translatedCategory = t(`module4.categories.${categoryKey}`, { defaultValue: String(category) });
                return (
                  <button
                    key={category}
                    className={`category-chip ${
                      selectedCategory === category ? "active" : ""
                    }`}
                    onClick={() => handleCategoryClick(category)}
                  >
                    {String(translatedCategory)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Terms Grid */}
        <div className="glossary-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t("common.loading")}</p>
            </div>
          ) : terms.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} className="empty-state-icon" />
              <h3>{t("module4.emptyState.title")}</h3>
              <p>{t("module4.emptyState.description")}</p>
            </div>
          ) : (
            <div className="term-grid">
              {terms.map((term) => {
                if (!term || typeof term !== 'object') return null;
                return (
                  <div
                    key={term.id || Math.random()}
                    className="term-card"
                    onClick={() => handleTermClick(term)}
                  >
                    <div className="term-card-header">
                      <h3 className="term-title">{String(term.term || '')}</h3>
                      <span className="term-category">{String(term.category || '')}</span>
                    </div>
                    <p className="term-definition">{String(term.shortDefinition || '')}</p>
                    <div className="term-card-footer">
                      <span className="term-link">{String(t("module4.viewDetails"))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Glossary Modal */}
      {isModalOpen && selectedTerm && (
        <GlossaryModal
          term={selectedTerm}
          language={i18n.language}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTerm(null);
          }}
          onTermClick={(termId) => {
            // Find the term by ID and open it
            const term = terms.find((t) => t.id === termId);
            if (term) {
              handleTermClick(term);
            } else {
              // If not in current results, fetch it
              const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
              fetch(`${apiUrl}/api/glossary/term/${termId}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    handleTermClick(data.term);
                  }
                })
                .catch((error) => errorHandler.handleNetworkError(error, { termId }));
            }
          }}
        />
      )}
    </div>
  );
};

export default Module4;

