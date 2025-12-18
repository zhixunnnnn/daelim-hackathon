import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import Module2 from "./Module2";
import ToastContainer from "./components/ToastContainer";
import { useToast } from "./hooks/useToast";
import "./App.css";

interface CsvAnalysisResult {
  summary: string;
  insights: string[];
  topActions: string[];
  dataPreview: Record<string, any>[];
  metadata: {
    fileName: string;
    rows: number;
    columns: string[];
  };
}

type ActivePage = "dashboard" | "textAnalysis";

function App() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvAnalysisResult, setCsvAnalysisResult] =
    useState<CsvAnalysisResult | null>(null);
  const [isCsvAnalyzing, setIsCsvAnalyzing] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setUploadedFile(droppedFile);
      toast.success(t("success.fileUploaded"));
    } else if (droppedFile) {
      toast.error(t("errors.invalidFileFormat"));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".csv")) {
        setUploadedFile(selectedFile);
        toast.success(t("success.fileUploaded"));
      } else {
        toast.error(t("errors.invalidFileFormat"));
      }
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast.error(t("errors.emptyFile"));
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (uploadedFile.size > maxSize) {
      toast.error(t("errors.fileTooLarge"));
      return;
    }

    setIsCsvAnalyzing(true);

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("language", i18n.language);

    try {
      const response = await fetch("http://localhost:5001/api/analyze-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status >= 500) {
          toast.error(t("errors.apiError"));
        } else {
          toast.error(t("errors.analysisError"));
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setCsvAnalysisResult({
          summary: data.analysis,
          insights: [],
          topActions: [],
          dataPreview: data.data_preview,
          metadata: {
            fileName: uploadedFile.name,
            rows: data.total_rows,
            columns: data.columns,
          },
        });
        toast.success(t("success.analysisComplete"));
      } else {
        toast.error(data.error || t("errors.analysisError"));
      }
    } catch (error) {
      console.error("Error analyzing CSV:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(t("errors.networkError"));
      } else {
        toast.error(t("errors.analysisError"));
      }
    } finally {
      setIsCsvAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setCsvAnalysisResult(null);
  };

  if (activePage === "textAnalysis") {
    return (
      <div className="app">
        <ToastContainer
          toasts={toast.toasts}
          onRemoveToast={toast.removeToast}
        />
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="logo-text">{t("app.name")}</span>
          </div>

          <nav className="nav">
            <div className="nav-section">
              <div className="nav-label">{t("nav.workspace")}</div>
              <a
                href="#"
                className="nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage("dashboard");
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                </svg>
                <span>{t("nav.dashboard")}</span>
              </a>
              <a href="#" className="nav-item active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeWidth="2"
                  />
                </svg>
                <span>{t("nav.textAnalysis")}</span>
              </a>
              <a href="#" className="nav-item disabled">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    strokeWidth="2"
                  />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15l-5-5L5 21" strokeWidth="2" />
                </svg>
                <span>{t("nav.imageRecognition")}</span>
                <span className="badge">{t("nav.comingSoon")}</span>
              </a>
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="language-switcher">
              <button
                className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
                onClick={() => changeLanguage("en")}
              >
                EN
              </button>
              <button
                className={`lang-btn ${i18n.language === "ko" ? "active" : ""}`}
                onClick={() => changeLanguage("ko")}
              >
                KO
              </button>
            </div>
            <div className="status-badge">
              <div className="status-dot"></div>
              <span>{t("status.online")}</span>
            </div>
          </div>
        </aside>

        <main className="main">
          <Module2 onBack={() => setActivePage("dashboard")} toast={toast} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="logo-text">{t("app.name")}</span>
        </div>

        <nav className="nav">
          <div className="nav-section">
            <div className="nav-label">{t("nav.workspace")}</div>
            <a href="#" className="nav-item active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
              </svg>
              <span>{t("nav.dashboard")}</span>
            </a>
            <a
              href="#"
              className="nav-item"
              onClick={(e) => {
                e.preventDefault();
                setActivePage("textAnalysis");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  strokeWidth="2"
                />
              </svg>
              <span>{t("nav.textAnalysis")}</span>
            </a>
            <a href="#" className="nav-item disabled">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="2"
                />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" strokeWidth="2" />
              </svg>
              <span>{t("nav.imageRecognition")}</span>
              <span className="badge">{t("nav.comingSoon")}</span>
            </a>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="language-switcher">
            <button
              className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
              onClick={() => changeLanguage("en")}
            >
              EN
            </button>
            <button
              className={`lang-btn ${i18n.language === "ko" ? "active" : ""}`}
              onClick={() => changeLanguage("ko")}
            >
              KO
            </button>
          </div>
          <div className="status-badge">
            <div className="status-dot"></div>
            <span>{t("status.online")}</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-content">
            <div className="breadcrumb">
              <span className="breadcrumb-item">
                {t("breadcrumb.workspace")}
              </span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item active">
                {t("breadcrumb.operationsOverview")}
              </span>
            </div>
            <div className="header-title">
              <h1>{t("header.title")}</h1>
              <p>{t("header.subtitle")}</p>
            </div>
          </div>
        </header>

        <div className="content">
          {!csvAnalysisResult ? (
            <div className="upload-container">
              <div
                className={`dropzone ${isDragging ? "dragging" : ""} ${uploadedFile ? "has-file" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-input"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                {!uploadedFile ? (
                  <label htmlFor="file-input" className="dropzone-label">
                    <div className="upload-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="dropzone-text">
                      <span className="dropzone-title">
                        {t("upload.title")}
                      </span>
                      <span className="dropzone-subtitle">
                        {t("upload.subtitle")}
                      </span>
                    </div>
                  </label>
                ) : (
                  <div className="file-info">
                    <div className="file-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                          strokeWidth="2"
                        />
                        <path
                          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div className="file-details">
                      <div className="file-name">{uploadedFile.name}</div>
                      <div className="file-meta">
                        {(uploadedFile.size / 1024).toFixed(1)}{" "}
                        {t("upload.fileSize")}
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-remove"
                      type="button"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {uploadedFile && (
                <div className="actions">
                  <button
                    className="btn-primary"
                    onClick={handleAnalyze}
                    disabled={isCsvAnalyzing}
                  >
                    {isCsvAnalyzing ? (
                      <>
                        <div className="spinner"></div>
                        {t("buttons.analyzing")}
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {t("buttons.analyzeWithAI")}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="results">
              <div className="results-header">
                <div className="results-meta">
                  <div className="meta-item">
                    <span className="meta-label">{t("results.file")}</span>
                    <span className="meta-value">
                      {csvAnalysisResult.metadata.fileName}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t("results.rows")}</span>
                    <span className="meta-value">
                      {csvAnalysisResult.metadata.rows}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t("results.columns")}</span>
                    <span className="meta-value">
                      {csvAnalysisResult.metadata.columns.length}
                    </span>
                  </div>
                </div>
                <button className="btn-secondary" onClick={handleReset}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M21 3v5h-5"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {t("buttons.newAnalysis")}
                </button>
              </div>

              <div className="insight-card summary-card">
                <div className="card-content">
                  <div className="ai-analysis markdown-content">
                    <ReactMarkdown>{csvAnalysisResult.summary}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="data-preview-card">
                <div className="card-header">
                  <h3>{t("results.dataPreview")}</h3>
                  <span className="preview-note">
                    {t("results.showingRows")}
                  </span>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(csvAnalysisResult.dataPreview[0]).map(
                          (key) => (
                            <th key={key}>{key}</th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {csvAnalysisResult.dataPreview.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, cellIdx) => (
                            <td key={cellIdx}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
