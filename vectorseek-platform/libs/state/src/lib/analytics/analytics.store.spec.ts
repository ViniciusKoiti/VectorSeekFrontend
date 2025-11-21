import { TestBed } from '@angular/core/testing';
import { AnalyticsStore } from './analytics.store';
import { AnalyticsOverview, AnalyticsError } from '@vectorseek/data-access';

describe('AnalyticsStore', () => {
  let store: AnalyticsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AnalyticsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(store.overview()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.dateRange()).toBe(30);
    expect(store.lastUpdatedAt()).toBeNull();
  });

  it('should have derived initial values', () => {
    expect(store.totalDocuments()).toBe(0);
    expect(store.uploadsPerWeek()).toEqual([]);
    expect(store.workspaceUsage()).toEqual([]);
    expect(store.topTemplates()).toEqual([]);
    expect(store.hasData()).toBe(false);
    expect(store.hasError()).toBe(false);
    expect(store.isEmpty()).toBe(false);
    expect(store.isStale()).toBe(true);
  });

  describe('setOverview', () => {
    it('should set overview data', () => {
      const mockOverview: AnalyticsOverview = {
        totalDocuments: 42,
        uploadsPerWeek: [
          { week_start: '2025-01-01', upload_count: 10 },
          { week_start: '2025-01-08', upload_count: 15 },
        ],
        workspaceUsage: [
          {
            workspace_id: 'ws-1',
            workspace_name: 'Engineering',
            document_count: 25,
            query_count: 100,
          },
        ],
        topTemplates: [
          { template_name: 'Summary', usage_count: 30 },
          { template_name: 'Report', usage_count: 12 },
        ],
      };

      store.setOverview(mockOverview);

      expect(store.overview()).toEqual(mockOverview);
      expect(store.totalDocuments()).toBe(42);
      expect(store.uploadsPerWeek().length).toBe(2);
      expect(store.workspaceUsage().length).toBe(1);
      expect(store.topTemplates().length).toBe(2);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.hasData()).toBe(true);
      expect(store.lastUpdatedAt()).toBeGreaterThan(0);
    });

    it('should mark as not stale after setting overview', () => {
      const mockOverview: AnalyticsOverview = {
        totalDocuments: 10,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(mockOverview);

      expect(store.isStale()).toBe(false);
    });

    it('should handle empty data', () => {
      const emptyOverview: AnalyticsOverview = {
        totalDocuments: 0,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(emptyOverview);

      expect(store.totalDocuments()).toBe(0);
      expect(store.isEmpty()).toBe(true);
      expect(store.hasData()).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      store.setLoading(true);

      expect(store.loading()).toBe(true);
    });

    it('should set loading state to false', () => {
      store.setLoading(true);
      store.setLoading(false);

      expect(store.loading()).toBe(false);
    });

    it('should clear error when starting to load', () => {
      const mockError: AnalyticsError = {
        status: 500,
        code: 'api_error',
        summary: 'Error',
        description: 'Something went wrong',
      };

      store.setError(mockError);
      expect(store.error()).toEqual(mockError);

      store.setLoading(true);
      expect(store.error()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error state', () => {
      const mockError: AnalyticsError = {
        status: 500,
        code: 'api_error',
        summary: 'Error occurred',
        description: 'Failed to load data',
      };

      store.setError(mockError);

      expect(store.error()).toEqual(mockError);
      expect(store.hasError()).toBe(true);
      expect(store.loading()).toBe(false);
    });

    it('should clear error when set to null', () => {
      const mockError: AnalyticsError = {
        status: 500,
        code: 'api_error',
        summary: 'Error',
        description: 'Error',
      };

      store.setError(mockError);
      store.setError(null);

      expect(store.error()).toBeNull();
      expect(store.hasError()).toBe(false);
    });
  });

  describe('setDateRange', () => {
    it('should set date range to 7 days', () => {
      store.setDateRange(7);

      expect(store.dateRange()).toBe(7);
    });

    it('should set date range to 30 days', () => {
      store.setDateRange(30);

      expect(store.dateRange()).toBe(30);
    });

    it('should set date range to 90 days', () => {
      store.setDateRange(90);

      expect(store.dateRange()).toBe(90);
    });
  });

  describe('clear', () => {
    it('should reset state to initial values', () => {
      const mockOverview: AnalyticsOverview = {
        totalDocuments: 42,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(mockOverview);
      store.setDateRange(7);
      store.setLoading(true);

      store.clear();

      expect(store.overview()).toBeNull();
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.dateRange()).toBe(30);
      expect(store.lastUpdatedAt()).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should clear error and mark as stale', () => {
      const mockError: AnalyticsError = {
        status: 500,
        code: 'api_error',
        summary: 'Error',
        description: 'Error',
      };

      store.setError(mockError);

      store.refresh();

      expect(store.error()).toBeNull();
      expect(store.lastUpdatedAt()).toBeNull();
      expect(store.isStale()).toBe(true);
    });
  });

  describe('computed selectors', () => {
    it('should compute totalDocuments from overview', () => {
      const mockOverview: AnalyticsOverview = {
        totalDocuments: 100,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(mockOverview);

      expect(store.totalDocuments()).toBe(100);
    });

    it('should return 0 for totalDocuments when no overview', () => {
      expect(store.totalDocuments()).toBe(0);
    });

    it('should compute uploadsPerWeek from overview', () => {
      const mockUploads = [
        { week_start: '2025-01-01', upload_count: 10 },
        { week_start: '2025-01-08', upload_count: 20 },
      ];

      const mockOverview: AnalyticsOverview = {
        totalDocuments: 30,
        uploadsPerWeek: mockUploads,
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(mockOverview);

      expect(store.uploadsPerWeek()).toEqual(mockUploads);
    });

    it('should compute workspaceUsage from overview', () => {
      const mockWorkspaces = [
        {
          workspace_id: 'ws-1',
          workspace_name: 'Engineering',
          document_count: 50,
          query_count: 200,
        },
      ];

      const mockOverview: AnalyticsOverview = {
        totalDocuments: 50,
        uploadsPerWeek: [],
        workspaceUsage: mockWorkspaces,
        topTemplates: [],
      };

      store.setOverview(mockOverview);

      expect(store.workspaceUsage()).toEqual(mockWorkspaces);
    });

    it('should compute topTemplates from overview', () => {
      const mockTemplates = [
        { template_name: 'Summary', usage_count: 50 },
        { template_name: 'Report', usage_count: 30 },
      ];

      const mockOverview: AnalyticsOverview = {
        totalDocuments: 80,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: mockTemplates,
      };

      store.setOverview(mockOverview);

      expect(store.topTemplates()).toEqual(mockTemplates);
    });
  });
});
