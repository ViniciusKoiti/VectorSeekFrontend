import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { DocumentsService, DocumentUploadResponse, DocumentsError } from '@vectorseek/data-access';
import { DocumentUploadComponent } from './document-upload.component';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let documentsService: jasmine.SpyObj<DocumentsService>;

  const createFile = (size: number, type: string, name: string): File => {
    const blob = new Blob([new ArrayBuffer(size)], { type });
    return new File([blob], name, { type });
  };

  beforeEach(async () => {
    documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', ['uploadDocument']);

    await TestBed.configureTestingModule({
      imports: [DocumentUploadComponent],
      providers: [
        { provide: DocumentsService, useValue: documentsService },
        { provide: MatDialogRef, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should reject files that exceed the size limit', () => {
    (component as any).maxFileSizeBytes = 50;
    const largeFile = createFile(100, 'application/pdf', 'large.pdf');

    (component as any).processFile(largeFile);

    expect(component.errorMessage()).toContain('Arquivo muito grande');
    expect(documentsService.uploadDocument).not.toHaveBeenCalled();
  });

  it('should reject files with invalid mime type', () => {
    const invalidFile = createFile(10, 'application/x-msdownload', 'virus.exe');

    (component as any).processFile(invalidFile);

    expect(component.errorMessage()).toContain('Tipo não permitido');
    expect(documentsService.uploadDocument).not.toHaveBeenCalled();
  });

  it('should emit uploadComplete when upload succeeds', () => {
    const validFile = createFile(10, 'application/pdf', 'doc.pdf');
    const subject = new Subject<any>();
    documentsService.uploadDocument.and.returnValue(subject.asObservable());
    const uploadSpy = jasmine.createSpy('uploadComplete');
    component.uploadComplete.subscribe(uploadSpy);

    (component as any).processFile(validFile);

    subject.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    expect(component.uploadProgress()).toBe(50);

    const apiResponse: DocumentUploadResponse = {
      documentId: '123',
      filename: 'doc.pdf',
      size: 10,
      status: 'processing',
      createdAt: new Date()
    };
    subject.next(new HttpResponse({ body: apiResponse }));

    expect(uploadSpy).toHaveBeenCalledWith(apiResponse);
    expect(component.isUploading()).toBeFalse();
  });

  it('should expose server error messages', () => {
    const validFile = createFile(10, 'application/pdf', 'doc.pdf');
    const subject = new Subject<any>();
    documentsService.uploadDocument.and.returnValue(subject.asObservable());

    (component as any).processFile(validFile);

    const apiError: DocumentsError = {
      status: 400,
      code: 'invalid_request',
      summary: 'File too large',
      description: 'Arquivo excede o limite'
    };
    subject.error(apiError);

    expect(component.errorMessage()).toBe(apiError.description ?? null);
    expect(component.isUploading()).toBeFalse();
  });
});
