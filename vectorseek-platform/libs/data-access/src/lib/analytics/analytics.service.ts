import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { ANALYTICS_API_ENDPOINTS } from './analytics.api';
import {
  AnalyticsOverviewResponse,
  AnalyticsOverview,
  AnalyticsError,
  DateRangeFilter,
} from './analytics.models';

/**
 * Error messages for different analytics actions
 */
const ACTION_ERROR_MESSAGES: Record<
  string,
  Record<number, { summary: string; description: string }> & {
    default: { summary: string; description: string };
  }
> = {
  getOverview: {
    401: {
      summary: 'analytics.error.unauthorized_summary',
      description: 'analytics.error.unauthorized_description',
    },
    403: {
      summary: 'analytics.error.forbidden_summary',
      description: 'analytics.error.forbidden_description',
    },
    429: {
      summary: 'analytics.error.rate_limit_summary',
      description: 'analytics.error.rate_limit_description',
    },
    503: {
      summary: 'analytics.error.service_unavailable_summary',
      description: 'analytics.error.service_unavailable_description',
    },
    default: {
      summary: 'analytics.error.generic_summary',
      description: 'analytics.error.generic_description',
    },
  },
};

/**
 * AnalyticsService
 *
 * Handles all HTTP operations for analytics and KPI data.
 * Provides methods to fetch dashboard metrics with error normalization
 * and retry logic for transient failures.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  /**
   * Get analytics overview with KPIs and metrics
   *
   * @param days - Number of days to fetch data for (7, 30, or 90)
   * @returns Observable of analytics overview data
   *
   * @example
   * ```typescript
   * analyticsService.getOverview(30).subscribe({
   *   next: (data) => console.log('KPIs:', data),
   *   error: (error) => console.error('Failed:', error)
   * });
   * ```
   */
  getOverview(days?: DateRangeFilter): Observable<AnalyticsOverview> {
    return this.http
      .get<AnalyticsOverviewResponse>(ANALYTICS_API_ENDPOINTS.overview(days))
      .pipe(
        retry({
          count: 2,
          delay: (error: HttpErrorResponse) => {
            // Retry on rate limiting or service unavailable
            if (error.status === 429 || error.status === 503) {
              return timer(2000);
            }
            return throwError(() => error);
          },
        }),
        map((response) => this.mapToOverview(response)),
        catchError((error) => this.handleError('getOverview', error))
      );
  }

  /**
   * Map API response to UI model
   */
  private mapToOverview(
    response: AnalyticsOverviewResponse
  ): AnalyticsOverview {
    return {
      totalDocuments: response.total_documents,
      uploadsPerWeek: response.uploads_per_week || [],
      workspaceUsage: response.workspace_usage || [],
      topTemplates: response.top_templates || [],
    };
  }

  /**
   * Handle HTTP errors with normalized error messages
   */
  private handleError(
    action: string,
    error: unknown
  ): Observable<never> {
    return throwError(() => this.normalizeError(action, error));
  }

  /**
   * Normalize error into standardized format
   */
  private normalizeError(action: string, error: unknown): AnalyticsError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        status: 0,
        code: 'unexpected_error',
        summary: 'analytics.error.unexpected_summary',
        description: 'analytics.error.unexpected_description',
      };
    }

    const status = error.status ?? 0;
    const messageConfig =
      ACTION_ERROR_MESSAGES[action]?.[status] ??
      ACTION_ERROR_MESSAGES[action]?.default ?? {
        summary: 'analytics.error.unknown_summary',
        description: 'analytics.error.unknown_description',
      };

    return {
      status,
      code: 'api_error',
      summary: messageConfig.summary,
      description: messageConfig.description,
    };
  }
}
