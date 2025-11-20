import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, DateRangeFilter } from '@vectorseek/data-access';
import { AnalyticsStore } from '@vectorseek/state';

/**
 * DashboardPageComponent
 *
 * Main dashboard page displaying analytics and KPIs.
 * Shows:
 * - Total documents
 * - Weekly upload trends
 * - Workspace usage
 * - Top 5 templates
 *
 * Supports filtering by date range (7, 30, or 90 days).
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
})
export class DashboardPageComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  readonly store = inject(AnalyticsStore);

  // Date range filter options
  readonly dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
    { value: 7, label: 'Últimos 7 dias' },
    { value: 30, label: 'Últimos 30 dias' },
    { value: 90, label: 'Últimos 90 dias' },
  ];

  constructor() {
    // React to date range changes
    effect(() => {
      const dateRange = this.store.dateRange();
      // Effect will run when dateRange changes
      // We don't reload here to avoid double loading on init
    });
  }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  /**
   * Load analytics data based on current date range
   */
  loadAnalytics(): void {
    this.store.setLoading(true);

    this.analyticsService.getOverview(this.store.dateRange()).subscribe({
      next: (overview) => {
        this.store.setOverview(overview);
      },
      error: (error) => {
        this.store.setError(error);
      },
    });
  }

  /**
   * Handle date range filter change
   */
  onDateRangeChange(dateRange: DateRangeFilter): void {
    this.store.setDateRange(dateRange);
    this.loadAnalytics();
  }

  /**
   * Retry loading analytics after error
   */
  retry(): void {
    this.store.setError(null);
    this.loadAnalytics();
  }

  /**
   * Get average weekly uploads for display
   */
  getAverageWeeklyUploads(): number {
    const uploads = this.store.uploadsPerWeek();
    if (uploads.length === 0) return 0;

    const total = uploads.reduce((sum, week) => sum + week.upload_count, 0);
    return Math.round(total / uploads.length);
  }

  /**
   * Get total workspaces for display
   */
  getTotalWorkspaces(): number {
    return this.store.workspaceUsage().length;
  }

  /**
   * Get top 5 templates (already limited by backend, but ensure here too)
   */
  getTop5Templates() {
    return this.store.topTemplates().slice(0, 5);
  }

  /**
   * Get maximum upload count for chart scaling
   */
  getMaxUploads(): number {
    const uploads = this.store.uploadsPerWeek();
    if (uploads.length === 0) return 1;

    return Math.max(...uploads.map((week) => week.upload_count), 1);
  }

  /**
   * Get maximum template usage for chart scaling
   */
  getMaxTemplateUsage(): number {
    const templates = this.store.topTemplates();
    if (templates.length === 0) return 1;

    return Math.max(...templates.map((t) => t.usage_count), 1);
  }

  /**
   * Format week start date for display
   * @param dateString - ISO date string
   * @returns Formatted date string (DD/MM)
   */
  formatWeekDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return dateString;
    }
  }
}
