import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { DocumentsService, DocumentUploadResponse } from '@vectorseek/data-access';
import { DocumentUploadComponent } from './document-upload.component';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';

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
      title: 'doc.pdf',
      status: 'pending',
      message: 'ok'
    };
    subject.next(new HttpResponse({ body: { data: apiResponse } }));

    expect(uploadSpy).toHaveBeenCalledWith(apiResponse);
    expect(component.isUploading()).toBeFalse();
  });

  it('should expose server error messages', () => {
    const validFile = createFile(10, 'application/pdf', 'doc.pdf');
    const subject = new Subject<any>();
    documentsService.uploadDocument.and.returnValue(subject.asObservable());

    (component as any).processFile(validFile);

    subject.error({ error: { error: 'File too large' } });

    expect(component.errorMessage()).toBe('File too large');
    expect(component.isUploading()).toBeFalse();
  });
});
