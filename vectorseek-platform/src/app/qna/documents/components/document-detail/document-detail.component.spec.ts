import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { DocumentDetailComponent } from './document-detail.component';
import {
  DocumentDetailResponse,
  DocumentsError,
  DocumentsService
} from '@vectorseek/data-access';

describe('DocumentDetailComponent', () => {
  let component: DocumentDetailComponent;
  let fixture: ComponentFixture<DocumentDetailComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;
  let snackBarOpenSpy: jasmine.Spy;
  const dialogOpenSpy = jasmine
    .createSpy('open')
    .and.returnValue({ afterClosed: () => of(true) });

  const paramMap$ = of(convertToParamMap({ id: 'doc-1' }));

  const mockDetail: DocumentDetailResponse['document'] = {
    id: 'doc-1',
    title: 'Documento 1',
    filename: 'documento.pdf',
    size: 1024,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    embeddingCount: 15
  };

  beforeEach(async () => {
    documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', [
      'getDocumentDetail',
      'reprocessDocument',
      'deleteDocument'
    ]);
    documentsService.getDocumentDetail.and.returnValue(of({ document: mockDetail }));
    documentsService.reprocessDocument.and.returnValue(
      of({ success: true, message: 'ok' })
    );
    documentsService.deleteDocument.and.returnValue(of({ success: true, message: 'ok' }));
    snackBarOpenSpy = jasmine.createSpy('open');

    await TestBed.configureTestingModule({
      imports: [DocumentDetailComponent, RouterTestingModule],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
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

  it('should trigger reprocess when confirmation succeeds', () => {
    component.onReprocess();
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(documentsService.reprocessDocument).toHaveBeenCalledWith('doc-1');
  });

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
