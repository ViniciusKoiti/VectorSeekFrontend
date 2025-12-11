import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentsService, DocumentUploadResponse, DocumentsError, Workspace } from '@vectorseek/data-access';
import { UploadProgressComponent } from '../upload-progress/upload-progress.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, UploadProgressComponent],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css']
})
export class DocumentUploadComponent implements OnDestroy, AfterViewInit {
  private readonly documentsService = inject(DocumentsService);
  protected readonly dialogRef = inject<MatDialogRef<DocumentUploadComponent> | null>(
    MatDialogRef,
    { optional: true }
  );
  protected readonly data = inject<{ workspaceId?: string; workspaces?: Workspace[] } | null>(
    MAT_DIALOG_DATA,
    { optional: true }
  );
  private readonly destroyRef = inject(DestroyRef);

  @Output() uploadComplete = new EventEmitter<DocumentUploadResponse>();
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dropzone') dropzone?: ElementRef<HTMLDivElement>;

  readonly isDragging = signal(false);
  readonly isUploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly statusMessage = signal('Arraste e solte ou selecione um arquivo para enviar.');
  readonly errorMessage = signal<string | null>(null);
  readonly selectedFileName = signal<string | null>(null);
  readonly selectedFileSize = signal<number | null>(null);
  readonly selectedFile = signal<File | null>(null);

  title = '';
  workspaceId = this.data?.workspaceId ?? '';
  workspaces = signal<Workspace[]>(this.data?.workspaces ?? []);

  protected maxFileSizeBytes = 100 * 1024 * 1024; // 100MB
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  private readonly allowedExtensions = ['pdf', 'docx', 'txt', 'md'];

  private uploadSubscription: Subscription | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  onSelectFileClick(): void {
    this.fileInput?.nativeElement.click();
  }

  onStartUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Nenhum arquivo selecionado.');
      return;
    }

    this.startUpload(file);
  }

  onCancelSelection(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set(null);
    this.selectedFileSize.set(null);
    this.errorMessage.set(null);
    this.statusMessage.set('Arraste e solte ou selecione um arquivo para enviar.');

    // Limpar input
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }

    // Anunciar para leitores de tela
    this.announceToScreenReader('Seleção cancelada. Escolha outro arquivo.');
  }

  cancelUpload(): void {
    if (!this.isUploading()) {
      return;
    }
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = null;
    this.isUploading.set(false);
    this.statusMessage.set('Upload cancelado.');

    // Anunciar cancelamento
    this.announceToScreenReader('Upload cancelado.');
  }

  ngAfterViewInit(): void {
    // Focar na dropzone quando o modal abre para melhor acessibilidade
    setTimeout(() => {
      this.dropzone?.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.uploadSubscription?.unsubscribe();
  }

  private processFile(file: File): void {
    if (!this.validateFile(file)) {
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.selectedFileSize.set(file.size);
    this.statusMessage.set('Arquivo pronto para upload. Clique em "Enviar" para continuar.');

    // Anunciar para leitores de tela
    this.announceToScreenReader(`Arquivo ${file.name} selecionado. Pronto para enviar.`);
  }

  private validateFile(file: File): boolean {
    if (!file) {
      this.errorMessage.set('Nenhum arquivo selecionado.');
      return false;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.errorMessage.set('Arquivo muito grande. Limite de 100MB.');
      return false;
    }

    const mimeOk = this.allowedMimeTypes.includes(file.type);
    const extension = this.getExtension(file.name);
    const extensionOk = this.allowedExtensions.includes(extension);

    if (!mimeOk && !extensionOk) {
      this.errorMessage.set('Tipo não permitido. Aceitos: PDF, DOCX, TXT, MD.');
      return false;
    }

    this.errorMessage.set(null);
    return true;
  }

  private startUpload(file: File): void {
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = null;
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.statusMessage.set('Enviando arquivo...');
    this.errorMessage.set(null);

    this.uploadSubscription = this.documentsService
      .uploadDocument({
        file,
        title: this.title.trim() || undefined,
        workspaceId: this.workspaceId.trim() || undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            this.uploadProgress.set(percent);
            this.statusMessage.set('Upload em andamento...');
          } else if (event instanceof HttpResponse) {
            const body = event.body;
            if (body) {
              this.handleUploadSuccess(body);
            } else {
              this.handleUploadError('Resposta inválida da API.');
            }
          }
        },
        error: (error: DocumentsError) => {
          const serverMessage = error.description ?? error.summary ?? 'Erro ao enviar arquivo.';
          this.handleUploadError(serverMessage);
        }
      });
  }

  private handleUploadSuccess(response: DocumentUploadResponse): void {
    this.isUploading.set(false);
    this.uploadProgress.set(100);
    this.statusMessage.set('Upload concluído. Processamento iniciado.');
    this.uploadSubscription = null;

    // Anunciar sucesso para leitores de tela
    this.announceToScreenReader('Upload concluído com sucesso');

    this.uploadComplete.emit(response);
    this.dialogRef?.close(response);
  }

  private handleUploadError(message: string): void {
    this.isUploading.set(false);
    this.statusMessage.set('Falha ao enviar arquivo.');
    this.errorMessage.set(message);
    this.uploadSubscription = null;
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  protected formatFileSize(bytes: number | null): string {
    if (!bytes && bytes !== 0) {
      return '';
    }
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Anuncia mensagem para leitores de tela via live region
   * Cria elemento temporário com role="status" para anúncio acessível
   */
  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    // Remover elemento após 1 segundo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}
