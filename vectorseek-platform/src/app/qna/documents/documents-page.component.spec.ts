import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { DocumentsPageComponent } from './documents-page.component';
import { DocumentsService, DocumentsListResponse } from '@vectorseek/data-access';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';

describe('DocumentsPageComponent', () => {
  let component: DocumentsPageComponent;
  let fixture: ComponentFixture<DocumentsPageComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let dialogOpenSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;
  let router: Router;

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
      'deleteDocument'
    ]);
    documentsService.listDocuments.and.returnValue(of(mockListResponse));
    documentsService.reprocessDocument.and.returnValue(of({ success: true, message: 'done' }));
    documentsService.deleteDocument.and.returnValue(of({ success: true, message: 'done' }));

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
});
