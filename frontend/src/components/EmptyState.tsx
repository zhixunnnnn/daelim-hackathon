import { useTranslation } from "react-i18next";
import "./EmptyState.css";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="empty-state-title">
        {title || t("module2.emptyState.title")}
      </h3>
      <p className="empty-state-description">
        {description || t("module2.emptyState.description")}
      </p>
    </div>
  );
}

export default EmptyState;
