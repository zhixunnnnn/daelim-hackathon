import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { FileText, Zap, Mail, Copy, X } from "lucide-react";
import EmptyState from "./components/EmptyState";
import { logAnalysis } from "./utils/analytics";
import { errorHandler } from "./utils/errorHandler";

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
    const startTime = Date.now();

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

      const processingTime = (Date.now() - startTime) / 1000;

      if (!response.ok) {
        logAnalysis(
          "text",
          "Failed to interpret text message",
          processingTime,
          "error"
        );
        if (response.status >= 500) {
          toast.error(t("module2.errors.apiError"));
        } else {
          toast.error(t("module2.errors.interpretError"));
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.interpretation) {
        setAnalysisResult(data.interpretation);
        logAnalysis(
          "text",
          "Text interpretation completed",
          processingTime,
          "success"
        );
        toast.success(t("module2.success.interpretComplete"));
      } else {
        logAnalysis(
          "text",
          "Failed to interpret text message",
          processingTime,
          "error"
        );
        toast.error(data.error || t("module2.errors.interpretError"));
      }
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000;
      logAnalysis(
        "text",
        "Failed to interpret text message",
        processingTime,
        "error"
      );
      errorHandler.handleNetworkError(error, { operation: "interpret" });
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
    const startTime = Date.now();

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

      const processingTime = (Date.now() - startTime) / 1000;

      if (!response.ok) {
        logAnalysis(
          "text",
          `Failed to convert text to ${type}`,
          processingTime,
          "error"
        );
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
        logAnalysis(
          "text",
          `Converted text to ${type}`,
          processingTime,
          "success"
        );
        toast.success(t("module2.success.convertComplete"));
      } else {
        logAnalysis(
          "text",
          `Failed to convert text to ${type}`,
          processingTime,
          "error"
        );
        toast.error(data.error || t("module2.errors.convertError"));
      }
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000;
      logAnalysis(
        "text",
        `Failed to convert text to ${type}`,
        processingTime,
        "error"
      );
      errorHandler.handleNetworkError(error, { operation: "convert", type });
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
      errorHandler.logError(error, { operation: "copy" });
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
                <FileText size={22} />
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
                    <Zap size={16} />
                    {t("module2.interpret.button")}
                  </>
                )}
              </button>
            </div>

            <div className="action-card">
              <div className="action-header">
                <Mail size={22} />
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
                    <Copy size={14} />
                    {t("module2.result.copy")}
                  </button>
                  <button className="btn-icon" onClick={handleClear}>
                    <X size={14} />
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
