// Analytics and data tracking utilities

export interface ActivityLog {
  id: string;
  type: "csv" | "text" | "image" | "glossary" | "glossary-ai-explain";
  title: string;
  timestamp: number;
  status: "success" | "error" | "warning";
}

export interface AnalyticsData {
  totalAnalyses: number;
  weeklyAnalyses: number;
  lastWeekAnalyses: number;
  avgProcessingTime: number;
  systemUptime: number;
  activities: ActivityLog[];
  lastReset: number;
}

const STORAGE_KEY = "astrasemi_analytics";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Initialize or get analytics data
export function getAnalytics(): AnalyticsData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    // Reset weekly count if a week has passed
    const now = Date.now();
    if (now - data.lastReset > WEEK_MS) {
      data.lastWeekAnalyses = data.weeklyAnalyses;
      data.weeklyAnalyses = 0;
      data.lastReset = now;
      saveAnalytics(data);
    }
    return data;
  }

  // Default data
  return {
    totalAnalyses: 0,
    weeklyAnalyses: 0,
    lastWeekAnalyses: 0,
    avgProcessingTime: 0,
    systemUptime: 99.2,
    activities: [],
    lastReset: Date.now(),
  };
}

// Save analytics data
export function saveAnalytics(data: AnalyticsData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Log an analysis
export function logAnalysis(
  type: "csv" | "text" | "image" | "glossary" | "glossary-ai-explain",
  title: string,
  processingTime: number = 0,
  status: "success" | "error" | "warning" = "success"
): void {
  const data = getAnalytics();

  // Update counts
  data.totalAnalyses++;
  data.weeklyAnalyses++;

  // Update average processing time
  data.avgProcessingTime =
    (data.avgProcessingTime * (data.totalAnalyses - 1) + processingTime) /
    data.totalAnalyses;

  // Add activity
  const activity: ActivityLog = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type,
    title,
    timestamp: Date.now(),
    status,
  };

  data.activities.unshift(activity);

  // Keep only last 50 activities
  if (data.activities.length > 50) {
    data.activities = data.activities.slice(0, 50);
  }

  saveAnalytics(data);
}

// Get trend percentage
export function getTrendPercentage(current: number, previous: number): number {
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

// Format time ago
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 120) return "1 minute ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return "1 hour ago";
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "1 day ago";
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Get status color
export function getStatusColor(
  status: "success" | "error" | "warning"
): string {
  switch (status) {
    case "success":
      return "success";
    case "error":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
}
