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
    component.onStartUpload();

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
    component.onStartUpload();

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

  describe('Accessibility (A11y)', () => {
    it('should have proper ARIA labels on dropzone', () => {
      const dropzone = fixture.nativeElement.querySelector('.dropzone');
      expect(dropzone.getAttribute('role')).toBe('button');
      expect(dropzone.getAttribute('aria-label')).toBeTruthy();
      expect(dropzone.getAttribute('tabindex')).toBe('0');
    });

    it('should set aria-busy during upload', () => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());

      (component as any).processFile(validFile);
      component.onStartUpload();
      fixture.detectChanges();

      const dropzone = fixture.nativeElement.querySelector('.dropzone');
      expect(dropzone.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-live regions for status messages', () => {
      fixture.detectChanges();
      const statusMessage = fixture.nativeElement.querySelector('.status-message');
      expect(statusMessage?.getAttribute('role')).toBe('status');
      expect(statusMessage?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live region for error messages', () => {
      component.errorMessage.set('Test error');
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('.error-message');
      expect(errorMessage?.getAttribute('role')).toBe('alert');
      expect(errorMessage?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should announce to screen readers on upload success', (done) => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());
      spyOn<any>(component, 'announceToScreenReader');

      (component as any).processFile(validFile);
      component.onStartUpload();

      const apiResponse: DocumentUploadResponse = {
        documentId: '123',
        filename: 'doc.pdf',
        size: 10,
        status: 'processing',
        createdAt: new Date()
      };
      subject.next(new HttpResponse({ body: { data: apiResponse } }));

      setTimeout(() => {
        expect(component['announceToScreenReader']).toHaveBeenCalledWith('Upload concluído com sucesso');
        done();
      }, 100);
    });
  });

  describe('Drag and Drop', () => {
    it('should add visual feedback on dragover', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');

      component.onDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragging()).toBeTrue();
    });

    it('should remove visual feedback on dragleave', () => {
      component['isDragging'].set(true);
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');

      component.onDragLeave(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragging()).toBeFalse();
    });

    it('should process file on drop', () => {
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      const dataTransfer = {
        files: [file] as any
      };
      const event = new DragEvent('drop');
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn<any>(component, 'processFile');

      component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component['processFile']).toHaveBeenCalledWith(file);
    });
  });

  describe('File Selection', () => {
    it('should trigger file input click', () => {
      component.fileInput = {
        nativeElement: {
          click: jasmine.createSpy('click')
        }
      } as any;

      component.onSelectFileClick();

      expect(component.fileInput!.nativeElement.click).toHaveBeenCalled();
    });

    it('should clear input value after file selection', () => {
      const input = document.createElement('input');
      input.type = 'file';

      const event = { target: input } as any;
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      Object.defineProperty(input, 'files', { value: [file] });
      spyOn<any>(component, 'processFile');

      component.onFileSelected(event);

      expect(input.value).toBe('');
      expect(component['processFile']).toHaveBeenCalledWith(file);
    });
  });

  describe('Preview Workflow', () => {
    it('should store file without starting upload', () => {
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      spyOn<any>(component, 'startUpload');

      (component as any).processFile(file);

      expect(component.selectedFile()).toBe(file);
      expect(component.selectedFileName()).toBe('doc.pdf');
      expect(component.selectedFileSize()).toBe(10);
      expect(component['startUpload']).not.toHaveBeenCalled();
    });

    it('should start upload when onStartUpload is called', () => {
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());

      (component as any).processFile(file);
      component.onStartUpload();

      expect(documentsService.uploadDocument).toHaveBeenCalled();
      expect(component.isUploading()).toBeTrue();
    });

    it('should clear selection on cancel', () => {
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      (component as any).processFile(file);

      expect(component.selectedFile()).toBe(file);

      component.onCancelSelection();

      expect(component.selectedFile()).toBeNull();
      expect(component.selectedFileName()).toBeNull();
      expect(component.selectedFileSize()).toBeNull();
      expect(component.errorMessage()).toBeNull();
    });

    it('should announce to screen reader on file selection', () => {
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      spyOn<any>(component, 'announceToScreenReader');

      (component as any).processFile(file);

      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Arquivo doc.pdf selecionado. Pronto para enviar.');
    });

    it('should show error if trying to upload without file', () => {
      component.selectedFile.set(null);

      component.onStartUpload();

      expect(component.errorMessage()).toBe('Nenhum arquivo selecionado.');
    });
  });

  describe('Cancellation', () => {
    it('should unsubscribe from upload on cancel', () => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());

      (component as any).processFile(validFile);
      component.onStartUpload();

      expect(component.isUploading()).toBeTrue();

      component.cancelUpload();

      expect(component.isUploading()).toBeFalse();
      expect(component.statusMessage()).toContain('cancelado');
    });

    it('should not cancel if not uploading', () => {
      component['isUploading'].set(false);
      const initialMessage = component.statusMessage();

      component.cancelUpload();

      expect(component.statusMessage()).toBe(initialMessage);
    });

    it('should announce cancellation to screen readers', () => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());
      spyOn<any>(component, 'announceToScreenReader');

      (component as any).processFile(validFile);
      component.onStartUpload();
      component.cancelUpload();

      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Upload cancelado.');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());

      (component as any).processFile(validFile);
      component.onStartUpload();

      subject.error({ message: 'Network error' });

      expect(component.errorMessage()).toBe('Erro ao enviar arquivo.');
      expect(component.isUploading()).toBeFalse();
    });

    it('should handle API error responses', () => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());

      (component as any).processFile(validFile);
      component.onStartUpload();

      subject.error({
        error: {
          error: 'File too large',
          max_size_mb: 100
        }
      });

      expect(component.errorMessage()).toBe('Erro ao enviar arquivo.');
    });
  });

  describe('File Validation', () => {
    it('should accept PDF files', () => {
      const file = createFile(10, 'application/pdf', 'doc.pdf');
      const result = (component as any).validateFile(file);
      expect(result).toBeTrue();
      expect(component.errorMessage()).toBeNull();
    });

    it('should accept DOCX files', () => {
      const file = createFile(
        10,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc.docx'
      );
      const result = (component as any).validateFile(file);
      expect(result).toBeTrue();
    });

    it('should accept TXT files', () => {
      const file = createFile(10, 'text/plain', 'doc.txt');
      const result = (component as any).validateFile(file);
      expect(result).toBeTrue();
    });

    it('should accept MD files', () => {
      const file = createFile(10, 'text/markdown', 'doc.md');
      const result = (component as any).validateFile(file);
      expect(result).toBeTrue();
    });

    it('should validate by extension when MIME type is wrong', () => {
      const file = createFile(10, 'application/octet-stream', 'doc.pdf');
      const result = (component as any).validateFile(file);
      expect(result).toBeTrue();
    });

    it('should reject file with no extension match', () => {
      const file = createFile(10, 'application/octet-stream', 'doc.exe');
      const result = (component as any).validateFile(file);
      expect(result).toBeFalse();
      expect(component.errorMessage()).toContain('Tipo não permitido');
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress during upload', () => {
      const validFile = createFile(10, 'application/pdf', 'doc.pdf');
      const subject = new Subject<any>();
      documentsService.uploadDocument.and.returnValue(subject.asObservable());

      (component as any).processFile(validFile);
      component.onStartUpload();

      subject.next({ type: HttpEventType.UploadProgress, loaded: 25, total: 100 });
      expect(component.uploadProgress()).toBe(25);

      subject.next({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
      expect(component.uploadProgress()).toBe(50);

      subject.next({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
      expect(component.uploadProgress()).toBe(100);
    });
  });
});
