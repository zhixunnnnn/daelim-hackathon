import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { logAnalysis } from "../utils/analytics";
import { errorHandler } from "../utils/errorHandler";

interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  shortDefinition: string;
  detailedDefinition: string;
  useCases: string[];
  relatedTerms: string[];
}

interface RelatedTerm {
  termId: string;
  reason: string;
}

interface GlossaryModalProps {
  term: GlossaryTerm;
  language: string;
  onClose: () => void;
  onTermClick: (termId: string) => void;
}

const GlossaryModal = ({
  term,
  language,
  onClose,
  onTermClick,
}: GlossaryModalProps) => {
  const { t } = useTranslation();
  const [aiExplanation, setAiExplanation] = useState("");
  const [relatedTerms, setRelatedTerms] = useState<RelatedTerm[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showAIExplanation, setShowAIExplanation] = useState(false);

  // Load related terms on mount
  useEffect(() => {
    loadRelatedTerms();
  }, [term.id]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const loadRelatedTerms = async () => {
    setLoadingRelated(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/api/glossary/related-terms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            term: term.term,
            language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setRelatedTerms(data.relatedTerms || []);
      }
    } catch (error) {
      errorHandler.handleNetworkError(error, { operation: "loadRelatedTerms", termId: term.id });
      setRelatedTerms([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleAIExplain = async () => {
    setLoadingAI(true);
    setShowAIExplanation(true);

    // Log analytics
    logAnalysis("glossary-ai-explain", `AI explained: ${term.term}`);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/api/glossary/ai-explain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            term: term.term,
            context: term.detailedDefinition,
            language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAiExplanation(data.explanation);
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      errorHandler.handleNetworkError(error, { operation: "aiExplain", term: term.term });
      setAiExplanation(
        "Error loading AI explanation. Please try again later."
      );
    } finally {
      setLoadingAI(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="glossary-modal-overlay" onClick={handleBackdropClick}>
      <div className="glossary-modal-content">
        {/* Header */}
        <div className="glossary-modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{String(term.term || '')}</h2>
            <span className="modal-category-badge">{String(term.category || '')}</span>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="glossary-modal-body">
          {/* Short Definition */}
          <div className="modal-section">
            <h3 className="modal-section-title">
              {String(t("module4.modal.definition"))}
            </h3>
            <p className="modal-definition">{String(term.shortDefinition || '')}</p>
          </div>

          {/* Detailed Explanation */}
          <div className="modal-section">
            <h3 className="modal-section-title">
              {String(t("module4.modal.details"))}
            </h3>
            <p className="modal-detail-text">{String(term.detailedDefinition || '')}</p>
          </div>

          {/* Use Cases */}
          {term.useCases && Array.isArray(term.useCases) && term.useCases.length > 0 && (
            <div className="modal-section">
              <h3 className="modal-section-title">
                {String(t("module4.modal.useCases"))}
              </h3>
              <ul className="modal-use-cases-list">
                {term.useCases.map((useCase, index) => (
                  <li key={index} className="modal-use-case-item">
                    {String(useCase || '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Explain Button */}
          <div className="modal-section">
            <button
              className="ai-explain-button"
              onClick={handleAIExplain}
              disabled={loadingAI}
            >
              <Sparkles size={18} />
              {loadingAI
                ? t("module4.modal.aiLoading")
                : t("module4.modal.aiExplain")}
            </button>
          </div>

          {/* AI Explanation */}
          {showAIExplanation && (
            <div className="modal-section ai-explanation-section">
              <h3 className="modal-section-title">
                {t("module4.modal.aiExplanation")}
              </h3>
              {loadingAI ? (
                <div className="ai-loading">
                  <Loader className="spinner" size={24} />
                  <p>{t("common.loading")}</p>
                </div>
              ) : (
                <div className="modal-ai-content">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Related Terms */}
          {(relatedTerms.length > 0 || loadingRelated) && (
            <div className="modal-section">
              <h3 className="modal-section-title">
                {t("module4.modal.relatedTerms")}
              </h3>
              {loadingRelated ? (
                <div className="related-loading">
                  <Loader className="spinner" size={20} />
                </div>
              ) : (
                <div className="related-terms-container">
                  {relatedTerms.map((related, index) => {
                    if (!related || typeof related !== 'object') return null;
                    const termId = String(related.termId || '');
                    const displayName = termId.replace(/-/g, " ");
                    return (
                      <button
                        key={index}
                        className="related-term-chip"
                        onClick={() => onTermClick(termId)}
                        title={String(related.reason || '')}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;

