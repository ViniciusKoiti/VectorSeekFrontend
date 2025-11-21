import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface CancelGenerationDialogData {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-cancel-generation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title ?? 'Cancelar geração?' }}</h2>
    <div mat-dialog-content>
      <p>{{ data.message ?? 'Tem certeza que deseja cancelar? O progresso atual será perdido.' }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">
        {{ data.cancelLabel ?? 'Continuar' }}
      </button>
      <button type="button" class="btn btn-danger" (click)="dialogRef.close(true)">
        {{ data.confirmLabel ?? 'Cancelar geração' }}
      </button>
    </div>
  `
})
export class CancelGenerationDialogComponent {
  readonly data = inject<CancelGenerationDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  readonly dialogRef = inject(MatDialogRef<CancelGenerationDialogComponent>);
}
