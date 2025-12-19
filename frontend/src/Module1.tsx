import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Upload, FileText, X, Zap, RotateCcw } from "lucide-react";
import { logAnalysis } from "./utils/analytics";
import { errorHandler } from "./utils/errorHandler";

interface Module1Props {
  onBack: () => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

interface CsvAnalysisResult {
  summary: string;
  dataPreview: Record<string, string | number | boolean | null>[];
  metadata: {
    fileName: string;
    rows: number;
    columns: string[];
  };
}

function Module1({ onBack, toast }: Module1Props) {
  const { t, i18n } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvAnalysisResult, setCsvAnalysisResult] =
    useState<CsvAnalysisResult | null>(null);
  const [isCsvAnalyzing, setIsCsvAnalyzing] = useState(false);

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

    const maxSize = 50 * 1024 * 1024;
    if (uploadedFile.size > maxSize) {
      toast.error(t("errors.fileTooLarge"));
      return;
    }

    setIsCsvAnalyzing(true);
    const startTime = Date.now();

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("language", i18n.language);

    try {
      const response = await fetch("http://localhost:5001/api/analyze-csv", {
        method: "POST",
        body: formData,
      });

      const processingTime = (Date.now() - startTime) / 1000;

      if (!response.ok) {
        logAnalysis(
          "csv",
          `Failed to analyze ${uploadedFile.name}`,
          processingTime,
          "error"
        );
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
          dataPreview: data.data_preview,
          metadata: {
            fileName: uploadedFile.name,
            rows: data.total_rows,
            columns: data.columns,
          },
        });

        logAnalysis(
          "csv",
          `Analyzed ${uploadedFile.name} - ${data.total_rows} rows`,
          processingTime,
          "success"
        );

        toast.success(t("success.analysisComplete"));
      } else {
        logAnalysis(
          "csv",
          `Failed to analyze ${uploadedFile.name}`,
          processingTime,
          "error"
        );
        toast.error(data.error || t("errors.analysisError"));
      }
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000;
      logAnalysis(
        "csv",
        `Failed to analyze ${uploadedFile.name}`,
        processingTime,
        "error"
      );
      const errorInfo = errorHandler.handleNetworkError(error, {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
      });
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

  return (
    <div className="module2-container">
      <header className="header">
        <div className="header-content">
          <div className="breadcrumb">
            <span className="breadcrumb-item">{t("breadcrumb.workspace")}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {t("breadcrumb.csvAnalysis")}
            </span>
          </div>
          <div className="header-title">
            <h1>{t("module1.title")}</h1>
            <p>{t("module1.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="content">
        {!csvAnalysisResult ? (
          <div className="input-section">
            <div
              className={`dropzone ${isDragging ? "dragging" : ""} ${
                uploadedFile ? "has-file" : ""
              }`}
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
                  <Upload className="upload-icon" size={40} />
                  <div className="dropzone-text">
                    <span className="dropzone-title">{t("upload.title")}</span>
                    <span className="dropzone-subtitle">
                      {t("upload.subtitle")}
                    </span>
                  </div>
                </label>
              ) : (
                <div className="file-info">
                  <FileText className="file-icon" size={36} />
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
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div
                className="actions-grid"
                style={{ gridTemplateColumns: "1fr" }}
              >
                <div className="action-card">
                  <div className="action-header">
                    <Zap size={22} />
                    <h3>{t("module1.analyze.title")}</h3>
                  </div>
                  <p className="action-description">
                    {t("module1.analyze.description")}
                  </p>
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
                        <Zap size={16} />
                        {t("buttons.analyzeWithAI")}
                      </>
                    )}
                  </button>
                </div>
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
                <RotateCcw size={14} />
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
                <span className="preview-note">{t("results.showingRows")}</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(csvAnalysisResult.dataPreview[0]).map(
                        (key) => (
                          <th key={key}>{key}</th>
                        )
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
    </div>
  );
}

export default Module1;
