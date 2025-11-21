import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { DocumentsPageComponent } from './documents-page.component';
import {
  Document,
  DocumentsListResult,
  DocumentsService,
  Workspace,
  WorkspacesService
} from '@vectorseek/data-access';
import { DocumentsDialogService } from './services/documents-dialog.service';

describe('DocumentsPageComponent', () => {
  let component: DocumentsPageComponent;
  let fixture: ComponentFixture<DocumentsPageComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let workspacesService: jasmine.SpyObj<WorkspacesService>;
  let snackBarOpenSpy: jasmine.Spy;
  let router: Router;
  let dialogServiceMock: jasmine.SpyObj<DocumentsDialogService>;

  const makeDocument = (): Document => ({
    id: 'doc-1',
    title: 'Doc 1',
    filename: 'doc1.pdf',
    size: 1024,
    status: 'completed',
    workspaceName: 'Workspace',
    workspaceId: 'ws-1',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:10:00Z'),
    processedAt: new Date('2023-01-01T10:15:00Z'),
    embeddingCount: 15,
    chunkCount: 15,
    contentPreview: undefined,
    error: undefined
  });

  const mockListResponse: DocumentsListResult = {
    data: [makeDocument()],
    total: 1,
    limit: 20,
    offset: 0
  };

  beforeEach(async () => {
    localStorage.clear();

    documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', [
      'listDocuments',
      'reprocessDocument',
      'deleteDocument',
      'listWorkspaces'
    ]);
    documentsService.listDocuments.and.returnValue(of(mockListResponse));

    workspacesService = jasmine.createSpyObj<WorkspacesService>('WorkspacesService', ['listWorkspaces']);
    workspacesService.listWorkspaces.and.returnValue(
      of([
        {
          id: 'ws-1',
          name: 'Workspace'
        } as Workspace
      ])
    );
    documentsService.reprocessDocument.and.returnValue(
      of({ documentId: 'doc-1', taskId: 'task-1', status: 'processing' })
    );
    documentsService.deleteDocument.and.returnValue(of({ id: 'doc-1', deletedAt: new Date() }));

    dialogServiceMock = jasmine.createSpyObj<DocumentsDialogService>('DocumentsDialogService', [
      'openUploadDialog',
      'confirmReprocess',
      'confirmDelete'
    ]);
    dialogServiceMock.openUploadDialog.and.returnValue(of({ documentId: 'doc-1' }));
    dialogServiceMock.confirmReprocess.and.returnValue(of(true));
    dialogServiceMock.confirmDelete.and.returnValue(of(true));

    snackBarOpenSpy = jasmine.createSpy('open');

    await TestBed.configureTestingModule({
      imports: [DocumentsPageComponent, RouterTestingModule],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: DocumentsDialogService, useValue: dialogServiceMock },
        { provide: MatSnackBar, useValue: { open: snackBarOpenSpy } },
        { provide: ActivatedRoute, useValue: { queryParams: of({}), params: of({}) } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(DocumentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should load documents on init', () => {
    expect(documentsService.listDocuments).toHaveBeenCalledWith(
      jasmine.objectContaining({
        limit: 20,
        offset: 0,
        status: undefined,
        workspaceId: undefined
      })
    );
    expect(component.documents().length).toBe(1);
  });

  it('should load workspaces on init', () => {
    expect(workspacesService.listWorkspaces).toHaveBeenCalled();
    expect(component.workspaces().length).toBeGreaterThan(0);
  });

  it('should navigate to details when requested', () => {
    component.onViewDetails(component.documents()[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/app/documents', 'doc-1']);
  });

  it('should trigger reprocess flow when confirmed', () => {
    component.onReprocessDocument(component.documents()[0]);
    expect(dialogServiceMock.confirmReprocess).toHaveBeenCalled();
    expect(documentsService.reprocessDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should delete document and reload list after confirmation', () => {
    component.onDeleteDocument(component.documents()[0]);
    expect(dialogServiceMock.confirmDelete).toHaveBeenCalled();
    expect(documentsService.deleteDocument).toHaveBeenCalledWith('doc-1');
    expect(documentsService.listDocuments).toHaveBeenCalledTimes(2);
  });

  it('should reload documents when upload dialog closes successfully', () => {
    const loadSpy = spyOn(component, 'loadDocuments').and.callThrough();
    loadSpy.calls.reset();
    component.openUploadDialog();
    expect(loadSpy).toHaveBeenCalledWith(1);
  });

  it('should apply workspace filter and persist preference', () => {
    component.selectedWorkspaceId = 'ws-1';
    documentsService.listDocuments.calls.reset();

    component.onWorkspaceChange();

    expect(localStorage.getItem('vectorseek.selectedWorkspaceId')).toBe('ws-1');
    expect(documentsService.listDocuments).toHaveBeenCalledWith(
      jasmine.objectContaining({
        workspaceId: 'ws-1'
      })
    );
  });

  it('should restore workspace preference on init', () => {
    fixture.destroy();
    localStorage.setItem('vectorseek.selectedWorkspaceId', 'ws-1');

    const newFixture = TestBed.createComponent(DocumentsPageComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.selectedWorkspaceId).toBe('ws-1');
    newFixture.destroy();
  });
});
