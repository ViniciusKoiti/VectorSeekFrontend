import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Document } from '@vectorseek/data-access';
import { DocumentUploadComponent } from '../components/document-upload/document-upload.component';
import { DeleteConfirmationModalComponent } from '../components/delete-confirmation-modal/delete-confirmation-modal.component';

type ConfirmationDialogOverrides = Partial<{
  title: string;
  message: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class DocumentsDialogService {
  private readonly dialog = inject(MatDialog);

  openUploadDialog(): Observable<unknown> {
    return this.dialog
      .open(DocumentUploadComponent, {
        width: '520px',
        disableClose: true
      })
      .afterClosed();
  }

  confirmReprocess(doc: Document, overrides: ConfirmationDialogOverrides = {}): Observable<boolean> {
    return this.dialog
      .open(DeleteConfirmationModalComponent, {
        width: '420px',
        data: {
          title: overrides.title ?? 'Reprocessar documento',
          message: overrides.message ?? `Deseja reprocessar "${doc.title ?? doc.filename}"?`,
          confirmLabel: overrides.confirmLabel ?? 'Reprocessar',
          description: overrides.description,
          danger: overrides.danger ?? false
        }
      })
      .afterClosed();
  }

  confirmDelete(doc: Document, overrides: ConfirmationDialogOverrides = {}): Observable<boolean> {
    return this.dialog
      .open(DeleteConfirmationModalComponent, {
        width: '420px',
        data: {
          title: overrides.title ?? 'Deletar documento',
          message:
            overrides.message ??
            `Tem certeza que deseja deletar "${doc.title ?? doc.filename}"?`,
          description:
            overrides.description ??
            'Esta ação não pode ser desfeita. Todos os chunks serão removidos.',
          confirmLabel: overrides.confirmLabel ?? 'Deletar',
          danger: overrides.danger ?? true
        }
      })
      .afterClosed();
  }
}
