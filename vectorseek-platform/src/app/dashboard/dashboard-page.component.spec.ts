import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardPageComponent } from './dashboard-page.component';
import { AnalyticsService, AnalyticsOverview } from '@vectorseek/data-access';
import { AnalyticsStore } from '@vectorseek/state';
import { of, throwError } from 'rxjs';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let mockAnalyticsService: jasmine.SpyObj<AnalyticsService>;
  let store: AnalyticsStore;

  const mockOverview: AnalyticsOverview = {
    totalDocuments: 42,
    uploadsPerWeek: [
      { week_start: '2025-01-01', upload_count: 10 },
      { week_start: '2025-01-08', upload_count: 20 },
      { week_start: '2025-01-15', upload_count: 15 },
    ],
    workspaceUsage: [
      {
        workspace_id: 'ws-1',
        workspace_name: 'Engineering',
        document_count: 25,
        query_count: 100,
      },
      {
        workspace_id: 'ws-2',
        workspace_name: 'Marketing',
        document_count: 17,
        query_count: 50,
      },
    ],
    topTemplates: [
      { template_name: 'Summary', usage_count: 30 },
      { template_name: 'Report', usage_count: 20 },
      { template_name: 'Analysis', usage_count: 15 },
      { template_name: 'Review', usage_count: 10 },
      { template_name: 'Meeting Notes', usage_count: 5 },
    ],
  };

  beforeEach(async () => {
    mockAnalyticsService = jasmine.createSpyObj('AnalyticsService', [
      'getOverview',
    ]);

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        AnalyticsStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(AnalyticsStore);

    // Clear store before each test
    store.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load analytics on init', () => {
      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));

      component.ngOnInit();

      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith(30); // Default is 30 days
      expect(store.overview()).toEqual(mockOverview);
    });

    it('should set loading state while fetching', () => {
      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));

      component.loadAnalytics();

      expect(store.loading()).toBe(false); // After subscription completes
    });

    it('should handle error on load', () => {
      const mockError = {
        status: 500,
        code: 'api_error',
        summary: 'Error',
        description: 'Failed to load',
      };

      mockAnalyticsService.getOverview.and.returnValue(
        throwError(() => mockError)
      );

      component.ngOnInit();

      expect(store.error()).toEqual(mockError);
      expect(store.loading()).toBe(false);
    });
  });

  describe('onDateRangeChange', () => {
    it('should update date range and reload analytics for 7 days', () => {
      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));

      component.onDateRangeChange(7);

      expect(store.dateRange()).toBe(7);
      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith(7);
    });

    it('should update date range and reload analytics for 30 days', () => {
      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));

      component.onDateRangeChange(30);

      expect(store.dateRange()).toBe(30);
      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith(30);
    });

    it('should update date range and reload analytics for 90 days', () => {
      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));

      component.onDateRangeChange(90);

      expect(store.dateRange()).toBe(90);
      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith(90);
    });
  });

  describe('retry', () => {
    it('should clear error and reload analytics', () => {
      const mockError = {
        status: 500,
        code: 'api_error',
        summary: 'Error',
        description: 'Failed',
      };

      store.setError(mockError);
      expect(store.error()).toEqual(mockError);

      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));

      component.retry();

      expect(store.error()).toBeNull();
      expect(mockAnalyticsService.getOverview).toHaveBeenCalled();
    });
  });

  describe('getAverageWeeklyUploads', () => {
    it('should calculate average weekly uploads', () => {
      store.setOverview(mockOverview);

      const average = component.getAverageWeeklyUploads();

      // (10 + 20 + 15) / 3 = 15
      expect(average).toBe(15);
    });

    it('should return 0 when no uploads data', () => {
      const emptyOverview: AnalyticsOverview = {
        totalDocuments: 0,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(emptyOverview);

      const average = component.getAverageWeeklyUploads();

      expect(average).toBe(0);
    });
  });

  describe('getTotalWorkspaces', () => {
    it('should return total number of workspaces', () => {
      store.setOverview(mockOverview);

      const total = component.getTotalWorkspaces();

      expect(total).toBe(2);
    });

    it('should return 0 when no workspaces', () => {
      const emptyOverview: AnalyticsOverview = {
        totalDocuments: 0,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(emptyOverview);

      const total = component.getTotalWorkspaces();

      expect(total).toBe(0);
    });
  });

  describe('getTop5Templates', () => {
    it('should return top 5 templates', () => {
      store.setOverview(mockOverview);

      const top5 = component.getTop5Templates();

      expect(top5.length).toBe(5);
      expect(top5[0].template_name).toBe('Summary');
      expect(top5[4].template_name).toBe('Meeting Notes');
    });

    it('should return all templates if less than 5', () => {
      const lessTemplatesOverview: AnalyticsOverview = {
        ...mockOverview,
        topTemplates: [
          { template_name: 'Summary', usage_count: 30 },
          { template_name: 'Report', usage_count: 20 },
        ],
      };

      store.setOverview(lessTemplatesOverview);

      const top5 = component.getTop5Templates();

      expect(top5.length).toBe(2);
    });

    it('should limit to 5 even if more templates exist', () => {
      const moreTemplatesOverview: AnalyticsOverview = {
        ...mockOverview,
        topTemplates: [
          { template_name: 'T1', usage_count: 60 },
          { template_name: 'T2', usage_count: 50 },
          { template_name: 'T3', usage_count: 40 },
          { template_name: 'T4', usage_count: 30 },
          { template_name: 'T5', usage_count: 20 },
          { template_name: 'T6', usage_count: 10 },
          { template_name: 'T7', usage_count: 5 },
        ],
      };

      store.setOverview(moreTemplatesOverview);

      const top5 = component.getTop5Templates();

      expect(top5.length).toBe(5);
      expect(top5[0].template_name).toBe('T1');
      expect(top5[4].template_name).toBe('T5');
    });
  });

  describe('getMaxUploads', () => {
    it('should return maximum upload count', () => {
      store.setOverview(mockOverview);

      const max = component.getMaxUploads();

      expect(max).toBe(20); // Max from [10, 20, 15]
    });

    it('should return 1 when no uploads', () => {
      const emptyOverview: AnalyticsOverview = {
        totalDocuments: 0,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(emptyOverview);

      const max = component.getMaxUploads();

      expect(max).toBe(1); // Default minimum
    });
  });

  describe('getMaxTemplateUsage', () => {
    it('should return maximum template usage', () => {
      store.setOverview(mockOverview);

      const max = component.getMaxTemplateUsage();

      expect(max).toBe(30); // Max from template usages
    });

    it('should return 1 when no templates', () => {
      const emptyOverview: AnalyticsOverview = {
        totalDocuments: 0,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(emptyOverview);

      const max = component.getMaxTemplateUsage();

      expect(max).toBe(1); // Default minimum
    });
  });

  describe('formatWeekDate', () => {
    it('should format ISO date string to DD/MM', () => {
      const formatted = component.formatWeekDate('2025-01-15');

      expect(formatted).toBe('15/01');
    });

    it('should format date with single digit day and month', () => {
      const formatted = component.formatWeekDate('2025-03-05');

      expect(formatted).toBe('05/03');
    });

    it('should return original string if date is invalid', () => {
      const invalidDate = 'invalid-date';

      const formatted = component.formatWeekDate(invalidDate);

      expect(formatted).toBe(invalidDate);
    });
  });

  describe('template rendering', () => {
    it('should show loading state', () => {
      store.setLoading(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loadingText = compiled.querySelector('.loading-text');

      expect(loadingText).toBeTruthy();
      expect(loadingText?.textContent).toContain('dashboard.loading.message');
    });

    it('should show error state', () => {
      const mockError = {
        status: 500,
        code: 'api_error',
        summary: 'analytics.error.generic_summary',
        description: 'analytics.error.generic_description',
      };

      store.setError(mockError);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorTitle = compiled.querySelector('.error-title');
      const errorDescription = compiled.querySelector('.error-description');

      expect(errorTitle?.textContent).toContain('analytics.error.generic_summary');
      expect(errorDescription?.textContent).toContain('analytics.error.generic_description');
    });

    it('should show empty state when data is empty', () => {
      const emptyOverview: AnalyticsOverview = {
        totalDocuments: 0,
        uploadsPerWeek: [],
        workspaceUsage: [],
        topTemplates: [],
      };

      store.setOverview(emptyOverview);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyTitle = compiled.querySelector('.empty-title');

      expect(emptyTitle?.textContent).toContain('dashboard.empty.title');
    });

    it('should show KPI cards with data', () => {
      mockAnalyticsService.getOverview.and.returnValue(of(mockOverview));
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const kpiCards = compiled.querySelectorAll('.kpi-card');

      expect(kpiCards.length).toBe(4);
    });

    it('should show all date range filter buttons', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const filterButtons = compiled.querySelectorAll('.filter-button');

      expect(filterButtons.length).toBe(3);
      // Translation keys will be displayed in tests without actual translation
      expect(filterButtons[0].textContent).toContain('dashboard.filters.last7Days');
      expect(filterButtons[1].textContent).toContain('dashboard.filters.last30Days');
      expect(filterButtons[2].textContent).toContain('dashboard.filters.last90Days');
    });
  });
});
