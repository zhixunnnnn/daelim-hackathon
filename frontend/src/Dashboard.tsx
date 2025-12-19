import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  FileText,
  Image,
  BookOpen,
  Cpu,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  getAnalytics,
  getTrendPercentage,
  formatTimeAgo,
  getStatusColor,
} from "./utils/analytics";
import type { ActivityLog } from "./utils/analytics";

interface DashboardProps {
  onNavigate: (
    page:
      | "dashboard"
      | "csvAnalysis"
      | "textAnalysis"
      | "imageAnalysis"
      | "glossary"
  ) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(getAnalytics());

  useEffect(() => {
    // Refresh analytics data
    const interval = setInterval(() => {
      setAnalytics(getAnalytics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const weeklyTrend = getTrendPercentage(
    analytics.weeklyAnalyses,
    analytics.lastWeekAnalyses
  );

  const processingTimeTrend = -12; // Negative is good (faster)

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-content">
          <div className="breadcrumb">
            <span className="breadcrumb-item">{t("breadcrumb.workspace")}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {t("dashboard.breadcrumb")}
            </span>
          </div>
          <div className="header-title">
            <h1>{t("dashboard.title")}</h1>
            <p>{t("dashboard.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="content dashboard-content">
        {/* Stats Grid - Asymmetric Bento Box Layout */}
        <div className="stats-bento">
          {/* Large Feature Card */}
          <div className="stat-feature">
            <div className="stat-feature-bg"></div>
            <div className="stat-feature-content">
              <div className="stat-label-sm">
                {t("dashboard.stats.systemStatus")}
              </div>
              <div className="stat-mega-value">Operational</div>
              <div className="uptime-ring">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray={`${analytics.systemUptime}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.5" className="percentage">
                    {analytics.systemUptime.toFixed(1)}%
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="stat-compact stat-analyses">
            <div className="stat-compact-header">
              <Zap size={20} />
              <span className="stat-label-xs">
                {t("dashboard.stats.analysesThisWeek")}
              </span>
            </div>
            <div className="stat-compact-body">
              <span className="stat-number-lg">{analytics.weeklyAnalyses}</span>
              {weeklyTrend !== 0 && (
                <span
                  className={`trend-badge ${
                    weeklyTrend > 0 ? "trend-up" : "trend-down"
                  }`}
                >
                  <TrendingUp
                    size={12}
                    style={
                      weeklyTrend < 0 ? { transform: "rotate(180deg)" } : {}
                    }
                  />
                  {weeklyTrend > 0 ? "+" : ""}
                  {weeklyTrend}%
                </span>
              )}
            </div>
            <div className="sparkline"></div>
          </div>

          <div className="stat-compact stat-processing">
            <div className="stat-compact-header">
              <Cpu size={20} />
              <span className="stat-label-xs">
                {t("dashboard.stats.avgProcessingTime")}
              </span>
            </div>
            <div className="stat-compact-body">
              <span className="stat-number-lg">
                {analytics.avgProcessingTime > 0
                  ? `${analytics.avgProcessingTime.toFixed(1)}s`
                  : "N/A"}
              </span>
              {analytics.avgProcessingTime > 0 && (
                <span className="trend-badge trend-down">
                  <TrendingUp
                    size={12}
                    style={{ transform: "rotate(180deg)" }}
                  />
                  {processingTimeTrend}%
                </span>
              )}
            </div>
            <div className="progress-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot active"></span>
            </div>
          </div>
        </div>

        {/* Quick Actions - Magnetic Grid */}
        <div className="quick-actions-section">
          <h2 className="section-title">{t("dashboard.quickActions.title")}</h2>
          <div className="actions-magnetic-grid">
            <button
              className="action-tile action-csv"
              onClick={() => onNavigate("csvAnalysis")}
            >
              <div className="action-tile-shine"></div>
              <div className="action-tile-icon">
                <FileText size={24} strokeWidth={1.5} />
              </div>
              <div className="action-tile-content">
                <h3>{t("dashboard.quickActions.csvAnalysis.title")}</h3>
                <p>{t("dashboard.quickActions.csvAnalysis.description")}</p>
              </div>
              <div className="action-tile-corner"></div>
            </button>

            <button
              className="action-tile action-text"
              onClick={() => onNavigate("textAnalysis")}
            >
              <div className="action-tile-shine"></div>
              <div className="action-tile-icon">
                <FileText size={24} strokeWidth={1.5} />
              </div>
              <div className="action-tile-content">
                <h3>{t("dashboard.quickActions.textAnalysis.title")}</h3>
                <p>{t("dashboard.quickActions.textAnalysis.description")}</p>
              </div>
              <div className="action-tile-corner"></div>
            </button>

            <button
              className="action-tile action-image action-wide"
              onClick={() => onNavigate("imageAnalysis")}
            >
              <div className="action-tile-shine"></div>
              <div className="action-tile-icon">
                <Image size={24} strokeWidth={1.5} />
              </div>
              <div className="action-tile-content">
                <h3>{t("dashboard.quickActions.imageAnalysis.title")}</h3>
                <p>{t("dashboard.quickActions.imageAnalysis.description")}</p>
              </div>
              <div className="action-tile-corner"></div>
            </button>

            <button
              className="action-tile action-glossary"
              onClick={() => onNavigate("glossary")}
            >
              <div className="action-tile-shine"></div>
              <div className="action-tile-icon">
                <BookOpen size={24} strokeWidth={1.5} />
              </div>
              <div className="action-tile-content">
                <h3>{String(t("dashboard.quickActions.glossary.title"))}</h3>
                <p>
                  {String(t("dashboard.quickActions.glossary.description"))}
                </p>
              </div>
              <div className="action-tile-corner"></div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <h2 className="section-title">
            {t("dashboard.recentActivity.title")}
          </h2>
          <div className="activity-list">
            {analytics.activities.length === 0 ? (
              <div className="activity-item activity-empty">
                <div className="activity-icon activity-icon-info">
                  <Activity size={16} />
                </div>
                <div className="activity-content">
                  <div className="activity-title">No recent activity</div>
                  <div className="activity-meta">
                    Start analyzing to see your activity here
                  </div>
                </div>
              </div>
            ) : (
              analytics.activities.slice(0, 10).map((activity: ActivityLog) => {
                const IconComponent =
                  activity.status === "success"
                    ? CheckCircle2
                    : activity.status === "warning"
                    ? AlertCircle
                    : Clock;

                return (
                  <div key={activity.id} className="activity-item">
                    <div
                      className={`activity-icon activity-icon-${getStatusColor(
                        activity.status
                      )}`}
                    >
                      <IconComponent size={16} />
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">
                        {String(activity.title || "Activity")}
                      </div>
                      <div className="activity-meta">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
