/**
 * Analytics API Endpoints
 *
 * This module defines all API endpoints for the analytics feature.
 * Endpoints follow the pattern: /api/analytics/*
 */

export const ANALYTICS_API_BASE_PATH = '/api/analytics';

export const ANALYTICS_API_ENDPOINTS = {
  /**
   * Get overview metrics for dashboard
   * @param days - Number of days to fetch data for (7, 30, or 90)
   * @returns /api/analytics/overview?days={days}
   */
  overview: (days?: number) => {
    const base = `${ANALYTICS_API_BASE_PATH}/overview`;
    return days ? `${base}?days=${days}` : base;
  },
} as const;
