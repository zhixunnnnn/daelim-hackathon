import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Upload, Image, X, Zap, Copy } from "lucide-react";
import EmptyState from "./components/EmptyState";
import { logAnalysis } from "./utils/analytics";
import { errorHandler } from "./utils/errorHandler";

interface Module3Props {
  onBack: () => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

function Module3({ onBack, toast }: Module3Props) {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("module3.errors.invalidType"));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(t("module3.errors.tooLarge"));
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult("");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageChange(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error(t("module3.errors.noImage"));
      return;
    }
    setIsProcessing(true);
    setAnalysisResult("");
    const startTime = Date.now();

    try {
      const base64 = await fileToBase64(selectedImage);
      const response = await fetch("http://localhost:5001/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          language: i18n.language,
        }),
      });

      const processingTime = (Date.now() - startTime) / 1000;

      if (!response.ok) {
        const errorData = await response.json();
        logAnalysis(
          "image",
          `Failed to analyze ${selectedImage.name}`,
          processingTime,
          "error"
        );
        throw new Error(errorData.error || t("module3.errors.analyzeFailed"));
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);

      logAnalysis(
        "image",
        `Analyzed ${selectedImage.name}`,
        processingTime,
        "success"
      );

      toast.success(t("module3.success.analyzed"));
    } catch (err: any) {
      const processingTime = (Date.now() - startTime) / 1000;
      logAnalysis(
        "image",
        `Failed to analyze ${selectedImage?.name || "image"}`,
        processingTime,
        "error"
      );
      errorHandler.handleNetworkError(err, {
        fileName: selectedImage?.name,
        fileSize: selectedImage?.size,
      });
      toast.error(err.message || t("module3.errors.analyzeFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysisResult);
      toast.success(t("module3.result.copied"));
    } catch (error) {
      errorHandler.logError(error, { operation: "copy" });
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClear = () => {
    setAnalysisResult("");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64."));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="module2-container">
      <header className="header">
        <div className="header-content">
          <div className="breadcrumb">
            <span className="breadcrumb-item">{t("breadcrumb.workspace")}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {t("breadcrumb.imageRecognition")}
            </span>
          </div>
          <div className="header-title">
            <h1>{t("module3.title")}</h1>
            <p>{t("module3.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="content">
        <div className="input-section">
          <div
            className={`dropzone ${isDragging ? "dragging" : ""} ${
              selectedImage ? "has-file" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />
            {!selectedImage ? (
              <label
                className="dropzone-label"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="upload-icon" size={40} />
                <div className="dropzone-text">
                  <span className="dropzone-title">
                    {t("module3.upload.title")}
                  </span>
                  <span className="dropzone-subtitle">
                    {t("module3.upload.subtitle")}
                  </span>
                </div>
              </label>
            ) : (
              <div className="file-info">
                <div
                  style={{
                    width: "120px",
                    height: "80px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <img
                    src={previewUrl || ""}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div className="file-details">
                  <div className="file-name">{selectedImage.name}</div>
                  <div className="file-meta">
                    {(selectedImage.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button className="btn-remove" onClick={handleRemove}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="actions-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="action-card">
              <div className="action-header">
                <Image size={22} />
                <h3>{t("module3.analyze.title")}</h3>
              </div>
              <p className="action-description">
                {t("module3.analyze.description")}
              </p>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={isProcessing || !selectedImage}
                title={!selectedImage ? t("module3.errors.noImage") : undefined}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    {t("module3.analyze.analyzing")}
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    {t("module3.analyze.button")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {!selectedImage && !analysisResult && (
          <EmptyState
            title={t("module3.emptyState.title")}
            description={t("module3.emptyState.description")}
          />
        )}

        {analysisResult && (
          <div className="result-section">
            <div className="result-card">
              <div className="result-header">
                <h3>{t("module3.result.title")}</h3>
                <div className="result-actions">
                  <button className="btn-icon" onClick={handleCopy}>
                    <Copy size={14} />
                    {t("module3.result.copy")}
                  </button>
                  <button className="btn-icon" onClick={handleClear}>
                    <X size={14} />
                    {t("module3.result.clear")}
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

export default Module3;
