import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { DocumentDetailComponent } from './document-detail.component';
import { Document, DocumentsError, DocumentsService } from '@vectorseek/data-access';
import { DocumentsDialogService } from '../../services/documents-dialog.service';

const createDocument = (): Document => ({
  id: 'doc-1',
  filename: 'documento.pdf',
  title: 'Documento 1',
  size: 1024,
  status: 'completed',
  workspaceId: 'ws-1',
  workspaceName: 'Workspace',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  updatedAt: new Date('2023-01-01T11:00:00Z'),
  processedAt: new Date('2023-01-01T11:05:00Z'),
  embeddingCount: 15,
  chunkCount: 15,
  processingTimeSeconds: 300,
  contentPreview: 'Conteúdo',
  error: undefined
});

describe('DocumentDetailComponent', () => {
  let component: DocumentDetailComponent;
  let fixture: ComponentFixture<DocumentDetailComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let snackBarOpenSpy: jasmine.Spy;
  let dialogServiceMock: jasmine.SpyObj<DocumentsDialogService>;

  const paramMap$ = of(convertToParamMap({ id: 'doc-1' }));
  const mockDetail = createDocument();

  beforeEach(async () => {
    documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', [
      'getDocumentDetail',
      'reprocessDocument',
      'deleteDocument'
    ]);
    documentsService.getDocumentDetail.and.returnValue(of(mockDetail));
    documentsService.reprocessDocument.and.returnValue(
      of({ documentId: 'doc-1', taskId: 'task-1', status: 'processing' })
    );
    documentsService.deleteDocument.and.returnValue(
      of({ id: 'doc-1', deletedAt: new Date() })
    );
    snackBarOpenSpy = jasmine.createSpy('open');

    // Mock mais completo do MatDialog
    dialogServiceMock = jasmine.createSpyObj<DocumentsDialogService>('DocumentsDialogService', [
      'confirmReprocess',
      'confirmDelete'
    ]);
    dialogServiceMock.confirmReprocess.and.returnValue(of(true));
    dialogServiceMock.confirmDelete.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [DocumentDetailComponent, RouterTestingModule],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: DocumentsDialogService, useValue: dialogServiceMock },
        { provide: MatSnackBar, useValue: { open: snackBarOpenSpy } },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load document detail on init', () => {
    expect(documentsService.getDocumentDetail).toHaveBeenCalledWith('doc-1');
    expect(component.document()).not.toBeNull();
    expect(component.document()?.id).toBe('doc-1');
  });

  it('should trigger reprocess when confirmation succeeds', fakeAsync(() => {
    component.onReprocess();
    tick(); // Processa o subscribe do afterClosed
    
    expect(dialogServiceMock.confirmReprocess).toHaveBeenCalled();
    expect(documentsService.reprocessDocument).toHaveBeenCalledWith('doc-1');
  }));

  it('should expose API error when detail request fails', () => {
    const apiError: DocumentsError = {
      status: 404,
      code: 'not_found',
      summary: 'Não encontrado'
    };
    documentsService.getDocumentDetail.and.returnValue(throwError(() => apiError));

    fixture = TestBed.createComponent(DocumentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toEqual(apiError);
  });
});
