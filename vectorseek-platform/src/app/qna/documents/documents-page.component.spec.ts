import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DocumentsPageComponent } from './documents-page.component';
import { Document, DocumentsListResult, DocumentsService, Workspace } from '@vectorseek/data-access';

describe('DocumentsPageComponent', () => {
  let component: DocumentsPageComponent;
  let fixture: ComponentFixture<DocumentsPageComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBarOpenSpy: jasmine.Spy;
  let router: Router;

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
    documentsService.listWorkspaces.and.returnValue(
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

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);

    snackBarOpenSpy = jasmine.createSpy('open');

    await TestBed.configureTestingModule({
      imports: [DocumentsPageComponent, RouterTestingModule],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: { open: snackBarOpenSpy } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(DocumentsPageComponent);
    component = fixture.componentInstance;
    // Ensure we always use the mocked dialog/snackbar instances
    (component as any).dialog = dialog;
    (component as any).snackBar = { open: snackBarOpenSpy } as any;
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
    expect(documentsService.listWorkspaces).toHaveBeenCalled();
    expect(component.workspaces().length).toBeGreaterThan(0);
  });

  it('should navigate to details when requested', () => {
    component.onViewDetails(component.documents()[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/app/documents', 'doc-1']);
  });

  it('should trigger reprocess flow when confirmed', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);

    component.onReprocessDocument(component.documents()[0]);

    expect(dialog.open).toHaveBeenCalled();
    expect(documentsService.reprocessDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should delete document and reload list after confirmation', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);

    component.onDeleteDocument(component.documents()[0]);

    expect(dialog.open).toHaveBeenCalled();
    expect(documentsService.deleteDocument).toHaveBeenCalledWith('doc-1');
    expect(documentsService.listDocuments).toHaveBeenCalledTimes(2);
  });

  it('should reload documents when upload dialog closes successfully', () => {
    dialog.open.and.returnValue({ afterClosed: () => of({ documentId: 'doc-1' }) } as any);
    const loadSpy = spyOn(component, 'loadDocuments').and.callThrough();
    loadSpy.calls.reset();

    component.openUploadDialog();

    expect(loadSpy).toHaveBeenCalledWith(1);
  });

  it('should apply workspace filter and persist preference', () => {
    component.selectedWorkspaceId = 'ws-1';
    documentsService.listDocuments.calls.reset();

    component.onWorkspaceChange();

    expect(localStorage.getItem('selectedWorkspaceId')).toBe('ws-1');
    expect(documentsService.listDocuments).toHaveBeenCalledWith(
      jasmine.objectContaining({
        workspaceId: 'ws-1'
      })
    );
  });

  it('should restore workspace preference on init', () => {
    fixture.destroy();
    localStorage.setItem('selectedWorkspaceId', 'ws-1');

    const newFixture = TestBed.createComponent(DocumentsPageComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.selectedWorkspaceId).toBe('ws-1');
    newFixture.destroy();
  });
});
