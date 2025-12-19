import React from "react";
import { useTranslation } from "react-i18next";

import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Image,
  BookOpen,
} from "lucide-react";

interface SidebarProps {
  activePage:
    | "dashboard"
    | "csvAnalysis"
    | "textAnalysis"
    | "imageAnalysis"
    | "glossary";
  onNavigate: (
    page:
      | "dashboard"
      | "csvAnalysis"
      | "textAnalysis"
      | "imageAnalysis"
      | "glossary"
  ) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { t, i18n } = useTranslation();

  const handleNavItemMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--tooltip-top",
      `${rect.top + rect.height / 2}px`
    );
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/image.png" alt="AstraSemi" className="logo-icon" />
      </div>

      <nav className="nav">
        <div className="nav-section">
          <div className="nav-label">{t("nav.workspace")}</div>
          <a
            href="#"
            className={`nav-item${activePage === "dashboard" ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("dashboard");
            }}
            onMouseEnter={handleNavItemMouseEnter}
            data-tooltip={String(t("nav.tooltips.dashboard"))}
          >
            <LayoutDashboard size={20} />
            <span>{t("nav.dashboard")}</span>
          </a>
          <a
            href="#"
            className={`nav-item${
              activePage === "csvAnalysis" ? " active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("csvAnalysis");
            }}
            onMouseEnter={handleNavItemMouseEnter}
            data-tooltip={String(t("nav.tooltips.csvAnalysis"))}
          >
            <FileText size={20} />
            <span>{t("nav.csvAnalysis")}</span>
          </a>
          <a
            href="#"
            className={`nav-item${
              activePage === "textAnalysis" ? " active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("textAnalysis");
            }}
            onMouseEnter={handleNavItemMouseEnter}
            data-tooltip={String(t("nav.tooltips.textAnalysis"))}
          >
            <MessageSquare size={20} />
            <span>{t("nav.textAnalysis")}</span>
          </a>
          <a
            href="#"
            className={`nav-item${
              activePage === "imageAnalysis" ? " active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("imageAnalysis");
            }}
            onMouseEnter={handleNavItemMouseEnter}
            data-tooltip={String(t("nav.tooltips.imageAnalysis"))}
          >
            <Image size={20} />
            <span>{t("nav.imageRecognition")}</span>
          </a>
          <a
            href="#"
            className={`nav-item${activePage === "glossary" ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("glossary");
            }}
            onMouseEnter={handleNavItemMouseEnter}
            data-tooltip={String(t("nav.tooltips.glossary"))}
          >
            <BookOpen size={20} />
            <span>{t("nav.glossary")}</span>
          </a>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="language-switcher">
          <button
            className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
            onClick={() => i18n.changeLanguage("en")}
          >
            EN
          </button>
          <button
            className={`lang-btn ${i18n.language === "ko" ? "active" : ""}`}
            onClick={() => i18n.changeLanguage("ko")}
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
  );
};

export default Sidebar;
