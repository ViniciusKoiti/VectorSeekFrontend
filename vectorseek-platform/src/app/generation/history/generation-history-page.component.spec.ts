import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { GenerationHistoryPageComponent } from './generation-history-page.component';
import {
  GenerationHistoryService,
  DocumentsService,
  ListHistoryResponse,
  Workspace,
  GenerationHistoryError
} from '@vectorseek/data-access';

type TranslateServiceMock = Pick<TranslateService, 'instant' | 'get'> & {
  onLangChange: Subject<unknown>;
  onTranslationChange: Subject<unknown>;
  onFallbackLangChange: Subject<unknown>;
  instant: jasmine.Spy;
  get: jasmine.Spy;
};

describe('GenerationHistoryPageComponent', () => {
  let component: GenerationHistoryPageComponent;
  let fixture: ComponentFixture<GenerationHistoryPageComponent>;
  let historyService: jasmine.SpyObj<GenerationHistoryService>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let translateService: TranslateServiceMock;
  let snackBarOpenSpy: jasmine.Spy;
  let router: Router;

  const mockWorkspaces: Workspace[] = [
    { id: 'ws-1', name: 'Workspace 1' },
    { id: 'ws-2', name: 'Workspace 2' }
  ];

  const mockHistoryResponse: ListHistoryResponse = {
    items: [
      {
        id: 'history-1',
        taskId: 'task-123',
        templateId: 'template-1',
        templateName: 'Blog Post',
        workspaceId: 'ws-1',
        workspaceName: 'Workspace 1',
        title: 'Test Generation',
        status: 'completed',
        duration: 45,
        createdAt: '2025-01-01T10:00:00Z',
        completedAt: '2025-01-01T10:00:45Z'
      }
    ],
    total: 1,
    page: 1,
    limit: 20,
    hasMore: false
  };

  beforeEach(async () => {
    localStorage.clear();

    historyService = jasmine.createSpyObj<GenerationHistoryService>('GenerationHistoryService', [
      'listHistory',
      'getHistoryDetail',
      'regenerate'
    ]);
    historyService.listHistory.and.returnValue(of(mockHistoryResponse));
    historyService.regenerate.and.returnValue(of({
      taskId: 'new-task-123',
      status: 'queued',
      message: 'Regeneration started'
    }));

    documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', [
      'listWorkspaces'
    ]);
    documentsService.listWorkspaces.and.returnValue(of(mockWorkspaces));

    translateService = {
      onLangChange: new Subject(),
      onTranslationChange: new Subject(),
      onFallbackLangChange: new Subject(),
      instant: jasmine.createSpy('instant').and.callFake((key: string, params?: any) => {
        // Mock simples que retorna a chave para testes
        if (params) {
          return `${key}_with_params`;
        }
        return key;
      }),
      get: jasmine.createSpy('get').and.returnValue(of(''))
    };

    snackBarOpenSpy = jasmine.createSpy('open');

    await TestBed.configureTestingModule({
      imports: [GenerationHistoryPageComponent, RouterTestingModule],
      providers: [
        { provide: GenerationHistoryService, useValue: historyService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: TranslateService, useValue: translateService },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: { open: snackBarOpenSpy } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(GenerationHistoryPageComponent);
    component = fixture.componentInstance;
    // Guarantee the component uses the mocked snackbar
    (component as any).snackBar = { open: snackBarOpenSpy } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load history on init', () => {
    expect(historyService.listHistory).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      workspaceId: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    expect(component.historyItems().length).toBe(1);
  });

  it('should load workspaces on init', () => {
    expect(documentsService.listWorkspaces).toHaveBeenCalled();
    expect(component.workspaces().length).toBe(2);
  });

  describe('Filtering', () => {
    it('should reload history when status filter changes', () => {
      historyService.listHistory.calls.reset();

      component.statusFilter = 'completed';
      component.onFilterChange();

      expect(historyService.listHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          status: 'completed',
          page: 1
        })
      );
    });

    it('should reload history when workspace filter changes', () => {
      historyService.listHistory.calls.reset();

      component.selectedWorkspaceId = 'ws-1';
      component.onWorkspaceChange();

      expect(historyService.listHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          workspaceId: 'ws-1',
          page: 1
        })
      );
    });

    it('should reload history when date filters change', () => {
      historyService.listHistory.calls.reset();

      component.startDateFilter = '2025-01-01';
      component.endDateFilter = '2025-01-31';
      component.onFilterChange();

      expect(historyService.listHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          page: 1
        })
      );
    });
  });

  describe('Pagination', () => {
    it('should load next page', () => {
      component.pagination.set({
        total: 50,
        page: 1,
        limit: 20,
        hasMore: true
      });
      historyService.listHistory.calls.reset();

      component.onNextPage();

      expect(historyService.listHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 2
        })
      );
    });

    it('should load previous page', () => {
      component.pagination.set({
        total: 50,
        page: 2,
        limit: 20,
        hasMore: true
      });
      historyService.listHistory.calls.reset();

      component.onPreviousPage();

      expect(historyService.listHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 1
        })
      );
    });

    it('should not go to previous page when on first page', () => {
      component.pagination.set({
        total: 20,
        page: 1,
        limit: 20,
        hasMore: false
      });
      historyService.listHistory.calls.reset();

      component.onPreviousPage();

      expect(historyService.listHistory).not.toHaveBeenCalled();
    });

    it('should not go to next page when hasMore is false', () => {
      component.pagination.set({
        total: 20,
        page: 1,
        limit: 20,
        hasMore: false
      });
      historyService.listHistory.calls.reset();

      component.onNextPage();

      expect(historyService.listHistory).not.toHaveBeenCalled();
    });
  });

  describe('Regenerate', () => {
    it('should regenerate a generation successfully', () => {
      const item = component.historyItems()[0];

      component.onRegenerate(item);

      expect(historyService.regenerate).toHaveBeenCalledWith('history-1');
      expect(translateService.instant).toHaveBeenCalledWith('generation.history.messages.regenerateSuccess');
      expect(translateService.instant).toHaveBeenCalledWith('generation.history.messages.close');
      expect(snackBarOpenSpy).toHaveBeenCalled();
    });

    it('should handle regenerate error', () => {
      const error: GenerationHistoryError = {
        status: 429,
        code: 'RATE_LIMIT',
        summary: 'Limite excedido',
        description: 'Aguarde alguns instantes'
      };
      historyService.regenerate.and.returnValue(throwError(() => error));

      const item = component.historyItems()[0];
      component.onRegenerate(item);

      expect(translateService.instant).toHaveBeenCalledWith('generation.history.messages.close');
      expect(snackBarOpenSpy).toHaveBeenCalled();
    });

    it('should set loading state during regenerate', () => {
      const item = component.historyItems()[0];

      expect(component.isActionLoading(item.id)).toBe(false);

      // Simulate loading state by checking the implementation
      component.onRegenerate(item);

      // After completion, loading should be false again
      expect(component.isActionLoading(item.id)).toBe(false);
    });
  });

  describe('View Details', () => {
    it('should show snackbar when viewing details', () => {
      const item = component.historyItems()[0];

      component.onViewDetails(item);

      expect(translateService.instant).toHaveBeenCalledWith('generation.history.messages.detailsMessage', { title: 'Test Generation' });
      expect(translateService.instant).toHaveBeenCalledWith('generation.history.messages.close');
      expect(snackBarOpenSpy).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should format duration correctly', () => {
      expect(component.formatDuration(undefined)).toBe('-');
      expect(component.formatDuration(30)).toBe('30s');
      expect(component.formatDuration(90)).toBe('1m 30s');
      expect(component.formatDuration(120)).toBe('2m');
      expect(component.formatDuration(3660)).toBe('1h 1m');
    });

    it('should get correct status label', () => {
      expect(component.getStatusLabel('queued')).toBe('generation.history.filters.statusQueued');
      expect(component.getStatusLabel('processing')).toBe('generation.history.filters.statusProcessing');
      expect(component.getStatusLabel('completed')).toBe('generation.history.filters.statusCompleted');
      expect(component.getStatusLabel('failed')).toBe('generation.history.filters.statusFailed');
      expect(component.getStatusLabel('cancelled')).toBe('generation.history.filters.statusCancelled');
    });

    it('should get correct status class', () => {
      expect(component.getStatusClass('completed')).toBe('status-completed');
      expect(component.getStatusClass('failed')).toBe('status-failed');
    });

    it('should format date correctly', () => {
      const dateString = '2025-01-15T14:30:00Z';
      const formatted = component.formatDate(dateString);
      expect(formatted).toContain('15/01/2025');
    });
  });

  describe('CSV Export', () => {
    it('should not export when no items', () => {
      component.historyItems.set([]);
      spyOn(document, 'createElement');

      component.onExportCSV();

      expect(document.createElement).not.toHaveBeenCalled();
    });

    it('should export CSV when items exist', () => {
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      const appendChildSpy = spyOn(document.body, 'appendChild');
      const removeChildSpy = spyOn(document.body, 'removeChild');

      component.onExportCSV();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading history', () => {
      const error: GenerationHistoryError = {
        status: 500,
        code: 'SERVER_ERROR',
        summary: 'Erro no servidor'
      };
      historyService.listHistory.and.returnValue(throwError(() => error));

      component.loadHistory();

      expect(component.error()).toEqual(error);
      expect(component.loading()).toBe(false);
    });

    it('should clear error when loading history successfully', () => {
      // Set an error first
      component.error.set({
        status: 500,
        code: 'ERROR',
        summary: 'Error'
      });

      // Reload should clear error
      component.loadHistory();

      expect(component.error()).toBeNull();
    });
  });

  describe('LocalStorage Preferences', () => {
    it('should save workspace preference to localStorage', () => {
      spyOn(localStorage, 'setItem');

      component.selectedWorkspaceId = 'ws-1';
      component.onWorkspaceChange();

      expect(localStorage.setItem).toHaveBeenCalledWith('selectedHistoryWorkspaceId', 'ws-1');
    });

    it('should load workspace preference from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue('ws-2');

      component.ngOnInit();

      expect(component.selectedWorkspaceId).toBe('ws-2');
    });
  });

  afterEach(() => {
    localStorage.clear();
  });
});
