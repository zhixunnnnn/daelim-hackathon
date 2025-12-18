import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import EmptyState from "./components/EmptyState";

interface Module2Props {
  onBack: () => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

type OperationType = "interpret" | "email" | "update" | null;

function Module2({ onBack, toast }: Module2Props) {
  const { t, i18n } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<OperationType>(null);

  const handleInterpret = async () => {
    if (!inputText.trim()) {
      toast.error(t("module2.errors.emptyText"));
      return;
    }

    setIsProcessing(true);
    setCurrentOperation("interpret");
    setAnalysisResult("");

    try {
      const response = await fetch("http://localhost:5001/api/interpret-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          language: i18n.language,
        }),
      });

      if (!response.ok) {
        if (response.status >= 500) {
          toast.error(t("module2.errors.apiError"));
        } else {
          toast.error(t("module2.errors.interpretError"));
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.interpretation);
        toast.success(t("module2.success.interpretComplete"));
      } else {
        toast.error(data.error || t("module2.errors.interpretError"));
      }
    } catch (error) {
      console.error("Error interpreting text:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(t("module2.errors.networkError"));
      } else {
        toast.error(t("module2.errors.interpretError"));
      }
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  };

  const handleConvert = async (type: "email" | "update") => {
    if (!inputText.trim()) {
      toast.error(t("module2.errors.emptyText"));
      return;
    }

    setIsProcessing(true);
    setCurrentOperation(type);
    setAnalysisResult("");

    try {
      const response = await fetch("http://localhost:5001/api/convert-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          type: type,
          language: i18n.language,
        }),
      });

      if (!response.ok) {
        if (response.status >= 500) {
          toast.error(t("module2.errors.apiError"));
        } else {
          toast.error(t("module2.errors.convertError"));
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.converted);
        toast.success(t("module2.success.convertComplete"));
      } else {
        toast.error(data.error || t("module2.errors.convertError"));
      }
    } catch (error) {
      console.error("Error converting text:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(t("module2.errors.networkError"));
      } else {
        toast.error(t("module2.errors.convertError"));
      }
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysisResult);
      toast.success(t("module2.success.textCopied"));
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClear = () => {
    setInputText("");
    setAnalysisResult("");
  };

  return (
    <div className="module2-container">
      <header className="header">
        <div className="header-content">
          <div className="breadcrumb">
            <span className="breadcrumb-item">{t("breadcrumb.workspace")}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {t("breadcrumb.textAnalysis")}
            </span>
          </div>
          <div className="header-title">
            <h1>{t("module2.title")}</h1>
            <p>{t("module2.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="content">
        <div className="input-section">
          <div className="input-card">
            <textarea
              className="text-input"
              placeholder={t("module2.inputPlaceholder")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="actions-grid">
            <div className="action-card">
              <div className="action-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3>{t("module2.interpret.title")}</h3>
              </div>
              <p className="action-description">
                {t("module2.interpret.description")}
              </p>
              <button
                className="btn-primary"
                onClick={handleInterpret}
                disabled={isProcessing || !inputText.trim()}
                title={
                  !inputText.trim() ? t("module2.errors.emptyText") : undefined
                }
              >
                {isProcessing && currentOperation === "interpret" ? (
                  <>
                    <div className="spinner"></div>
                    {t("module2.interpret.analyzing")}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t("module2.interpret.button")}
                  </>
                )}
              </button>
            </div>

            <div className="action-card">
              <div className="action-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    strokeWidth="2"
                  />
                  <path d="M22 6l-10 7L2 6" strokeWidth="2" />
                </svg>
                <h3>{t("module2.convert.title")}</h3>
              </div>
              <p className="action-description">
                {t("module2.convert.description")}
              </p>
              <div className="button-group">
                <button
                  className="btn-secondary"
                  onClick={() => handleConvert("email")}
                  disabled={isProcessing || !inputText.trim()}
                  title={
                    !inputText.trim()
                      ? t("module2.errors.emptyText")
                      : undefined
                  }
                >
                  {isProcessing && currentOperation === "email" ? (
                    <>
                      <div className="spinner"></div>
                      {t("module2.convert.converting")}
                    </>
                  ) : (
                    t("module2.convert.toEmail")
                  )}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleConvert("update")}
                  disabled={isProcessing || !inputText.trim()}
                  title={
                    !inputText.trim()
                      ? t("module2.errors.emptyText")
                      : undefined
                  }
                >
                  {isProcessing && currentOperation === "update" ? (
                    <>
                      <div className="spinner"></div>
                      {t("module2.convert.converting")}
                    </>
                  ) : (
                    t("module2.convert.toUpdate")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {!inputText.trim() && !analysisResult && <EmptyState />}

        {analysisResult && (
          <div className="result-section">
            <div className="result-card">
              <div className="result-header">
                <h3>{t("module2.result.title")}</h3>
                <div className="result-actions">
                  <button className="btn-icon" onClick={handleCopy}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                        strokeWidth="2"
                      />
                    </svg>
                    {t("module2.result.copy")}
                  </button>
                  <button className="btn-icon" onClick={handleClear}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    {t("module2.result.clear")}
                  </button>
                </div>
              </div>
              <div className="result-content markdown-content">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Module2;
