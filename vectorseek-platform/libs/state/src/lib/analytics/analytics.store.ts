import { Injectable, computed, signal } from '@angular/core';
import {
  AnalyticsOverview,
  AnalyticsError,
  DateRangeFilter,
} from '@vectorseek/data-access';

/**
 * Analytics state interface
 */
export interface AnalyticsState {
  overview: AnalyticsOverview | null;
  loading: boolean;
  error: AnalyticsError | null;
  dateRange: DateRangeFilter;
  lastUpdatedAt: number | null;
}

/**
 * Initial state for analytics
 */
const initialState: AnalyticsState = {
  overview: null,
  loading: false,
  error: null,
  dateRange: 30, // Default to 30 days
  lastUpdatedAt: null,
};

/**
 * AnalyticsStore
 *
 * Signal-based state management for analytics and KPI data.
 * Manages dashboard metrics, loading states, and error handling.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class DashboardComponent {
 *   readonly store = inject(AnalyticsStore);
 *
 *   // Access computed values
 *   totalDocs = this.store.totalDocuments();
 *   isLoading = this.store.loading();
 *
 *   // Update state
 *   this.store.setDateRange(7);
 *   this.store.setOverview(data);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
  private readonly state = signal<AnalyticsState>(initialState);

  // Primary computed selectors
  readonly overview = computed(() => this.state().overview);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly dateRange = computed(() => this.state().dateRange);
  readonly lastUpdatedAt = computed(() => this.state().lastUpdatedAt);

  // Derived computed selectors for KPIs
  readonly totalDocuments = computed(() => {
    const overview = this.state().overview;
    return overview?.totalDocuments ?? 0;
  });

  readonly uploadsPerWeek = computed(() => {
    const overview = this.state().overview;
    return overview?.uploadsPerWeek ?? [];
  });

  readonly workspaceUsage = computed(() => {
    const overview = this.state().overview;
    return overview?.workspaceUsage ?? [];
  });

  readonly topTemplates = computed(() => {
    const overview = this.state().overview;
    return overview?.topTemplates ?? [];
  });

  // Utility computed selectors
  readonly hasData = computed(() => {
    const overview = this.state().overview;
    return overview !== null;
  });

  readonly hasError = computed(() => {
    const error = this.state().error;
    return error !== null;
  });

  readonly isEmpty = computed(() => {
    const overview = this.state().overview;
    return overview !== null && overview.totalDocuments === 0;
  });

  readonly isStale = computed(() => {
    const lastUpdated = this.state().lastUpdatedAt;
    if (!lastUpdated) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastUpdated > fiveMinutes;
  });

  // Actions to update state

  /**
   * Set the complete analytics overview
   */
  setOverview(overview: AnalyticsOverview): void {
    this.state.update((state) => ({
      ...state,
      overview,
      loading: false,
      error: null,
      lastUpdatedAt: Date.now(),
    }));
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.state.update((state) => ({
      ...state,
      loading,
      error: loading ? null : state.error, // Clear error when starting to load
    }));
  }

  /**
   * Set error state
   */
  setError(error: AnalyticsError | null): void {
    this.state.update((state) => ({
      ...state,
      error,
      loading: false,
    }));
  }

  /**
   * Set date range filter
   */
  setDateRange(dateRange: DateRangeFilter): void {
    this.state.update((state) => ({
      ...state,
      dateRange,
    }));
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.state.set(initialState);
  }

  /**
   * Refresh analytics data (trigger re-fetch)
   * This doesn't fetch data directly, but marks it as stale
   * and clears error state to allow re-fetch
   */
  refresh(): void {
    this.state.update((state) => ({
      ...state,
      error: null,
      lastUpdatedAt: null,
    }));
  }
}
