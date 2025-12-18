import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import "./App.css";

interface AnalysisResult {
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

function App() {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", i18n.language);

    try {
      console.log("📤 Sending request to backend...");
      const response = await fetch("http://localhost:5001/api/analyze-csv", {
        method: "POST",
        body: formData,
      });

      console.log(
        "📥 Response received:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response not OK:", errorText);
        throw new Error(`Failed to analyze CSV: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Data parsed:", data);

      if (data.success) {
        console.log("✅ Success! Setting results...");
        setResult({
          summary: data.analysis,
          insights: [],
          topActions: [],
          dataPreview: data.data_preview,
          metadata: {
            fileName: file.name,
            rows: data.total_rows,
            columns: data.columns,
          },
        });
        console.log("✅ Results set successfully!");
      } else {
        console.error("❌ Data.success is false");
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("❌ Error analyzing CSV:", error);
      alert(
        "Failed to analyze CSV. Error: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="app">
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
            <a href="#" className="nav-item disabled">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  strokeWidth="2"
                />
              </svg>
              <span>{t("nav.textAnalysis")}</span>
              <span className="badge">{t("nav.comingSoon")}</span>
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
          {!result ? (
            <div className="upload-container">
              <div
                className={`dropzone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
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

                {!file ? (
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
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        {(file.size / 1024).toFixed(1)} {t("upload.fileSize")}
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

              {file && (
                <div className="actions">
                  <button
                    className="btn-primary"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
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
                      {result.metadata.fileName}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t("results.rows")}</span>
                    <span className="meta-value">{result.metadata.rows}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t("results.columns")}</span>
                    <span className="meta-value">
                      {result.metadata.columns.length}
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
                    <ReactMarkdown>{result.summary}</ReactMarkdown>
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
                        {Object.keys(result.dataPreview[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.dataPreview.map((row, idx) => (
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
