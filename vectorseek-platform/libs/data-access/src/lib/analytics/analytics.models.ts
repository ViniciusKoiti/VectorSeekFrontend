/**
 * Analytics Models
 *
 * This module defines all TypeScript interfaces and types for the analytics feature.
 */

/**
 * Template usage data
 */
export interface TemplateUsage {
  template_name: string;
  usage_count: number;
}

/**
 * Weekly upload trend data
 */
export interface WeeklyUpload {
  week_start: string; // ISO date string
  upload_count: number;
}

/**
 * Workspace usage data
 */
export interface WorkspaceUsage {
  workspace_id: string;
  workspace_name: string;
  document_count: number;
  query_count: number;
}

/**
 * Complete analytics overview response from API
 */
export interface AnalyticsOverviewResponse {
  total_documents: number;
  uploads_per_week: WeeklyUpload[];
  workspace_usage: WorkspaceUsage[];
  top_templates: TemplateUsage[];
}

/**
 * Processed analytics overview for UI consumption
 */
export interface AnalyticsOverview {
  totalDocuments: number;
  uploadsPerWeek: WeeklyUpload[];
  workspaceUsage: WorkspaceUsage[];
  topTemplates: TemplateUsage[];
}

/**
 * Date range filter options
 */
export type DateRangeFilter = 7 | 30 | 90;

/**
 * Analytics error object for normalized error handling
 */
export interface AnalyticsError {
  status: number;
  code: string;
  summary: string;
  description: string;
}
