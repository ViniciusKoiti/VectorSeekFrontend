import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { DocumentsPageComponent } from './documents-page.component';
import { DocumentsService, DocumentsListResponse, Workspace } from '@vectorseek/data-access';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';

describe('DocumentsPageComponent', () => {
  let component: DocumentsPageComponent;
  let fixture: ComponentFixture<DocumentsPageComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let dialogOpenSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;
  let router: Router;

  const mockWorkspaces: Workspace[] = [
    { id: 'ws-1', name: 'Workspace 1' },
    { id: 'ws-2', name: 'Workspace 2' }
  ];

  const mockListResponse: DocumentsListResponse = {
    documents: [
      {
        id: 'doc-1',
        title: 'Doc 1',
        filename: 'doc1.pdf',
        size: 1024,
        status: 'completed',
        workspaceName: 'Workspace',
        workspaceId: 'ws-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        embeddingCount: 15,
        chunkCount: 15,
        indexedAt: new Date().toISOString()
      }
    ],
    pagination: {
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1
    }
  };

  beforeEach(async () => {
    documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', [
      'listDocuments',
      'reprocessDocument',
      'deleteDocument',
      'listWorkspaces'
    ]);
    documentsService.listDocuments.and.returnValue(of(mockListResponse));
    documentsService.reprocessDocument.and.returnValue(of({ success: true, message: 'done' }));
    documentsService.deleteDocument.and.returnValue(of({ success: true, message: 'done' }));
    documentsService.listWorkspaces.and.returnValue(of(mockWorkspaces));

    dialogOpenSpy = jasmine.createSpy('open').and.callFake((componentType?: unknown) => {
      if (componentType === DocumentUploadComponent) {
        return { afterClosed: () => of({ documentId: 'doc-1' }) };
      }
      return { afterClosed: () => of(true) };
    });
    snackBarOpenSpy = jasmine.createSpy('open');

    await TestBed.configureTestingModule({
      imports: [DocumentsPageComponent, RouterTestingModule],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
        { provide: MatSnackBar, useValue: { open: snackBarOpenSpy } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(DocumentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load documents on init', () => {
    expect(documentsService.listDocuments).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: undefined,
      workspaceId: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    expect(component.documents().length).toBe(1);
  });

  it('should navigate to details when requested', () => {
    component.onViewDetails(component.documents()[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/app/documents', 'doc-1']);
  });

  it('should trigger reprocess flow when confirmed', () => {
    component.onReprocessDocument(component.documents()[0]);
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(documentsService.reprocessDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should delete document and reload list after confirmation', () => {
    component.onDeleteDocument(component.documents()[0]);
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(documentsService.deleteDocument).toHaveBeenCalledWith('doc-1');
    expect(documentsService.listDocuments).toHaveBeenCalledTimes(2);
  });

  it('should reload documents when upload dialog closes successfully', () => {
    const loadSpy = spyOn(component, 'loadDocuments').and.callThrough();
    loadSpy.calls.reset();
    component.openUploadDialog();
    expect(loadSpy).toHaveBeenCalledWith(1);
  });

  describe('Workspace Filter', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should load workspaces on init', () => {
      expect(documentsService.listWorkspaces).toHaveBeenCalled();
      expect(component.workspaces().length).toBe(2);
      expect(component.workspaces()[0].name).toBe('Workspace 1');
    });

    it('should filter documents when workspace is selected', () => {
      component.selectedWorkspaceId = 'ws-1';
      documentsService.listDocuments.calls.reset();

      component.onWorkspaceChange();

      expect(documentsService.listDocuments).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: undefined,
        workspaceId: 'ws-1',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should save workspace preference to localStorage when changed', () => {
      component.selectedWorkspaceId = 'ws-2';

      component.onWorkspaceChange();

      expect(localStorage.getItem('selectedWorkspaceId')).toBe('ws-2');
    });

    it('should restore workspace preference from localStorage on init', () => {
      localStorage.setItem('selectedWorkspaceId', 'ws-1');

      const newFixture = TestBed.createComponent(DocumentsPageComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.selectedWorkspaceId).toBe('ws-1');
    });

    it('should handle error when loading workspaces fails', () => {
      documentsService.listWorkspaces.and.returnValue(throwError(() => new Error('API Error')));
      const consoleSpy = spyOn(console, 'error');

      const newFixture = TestBed.createComponent(DocumentsPageComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith('Erro ao carregar workspaces:', jasmine.any(Error));
      expect(newComponent.workspaces().length).toBe(0);
      expect(newComponent.isLoadingWorkspaces()).toBe(false);
    });

    it('should clear workspace filter when empty string is selected', () => {
      component.selectedWorkspaceId = '';
      documentsService.listDocuments.calls.reset();

      component.onWorkspaceChange();

      expect(documentsService.listDocuments).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: undefined,
        workspaceId: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });
  });
});
