import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface WorkspaceDeleteDialogData {
  name: string;
}

@Component({
  selector: 'app-workspace-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Deletar workspace</h2>
    <div mat-dialog-content>
      <p>
        Tem certeza que deseja deletar "{{ data.name }}"?
        Esta ação não pode ser desfeita.
      </p>
    </div>
    <div mat-dialog-actions align="end">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">
        Cancelar
      </button>
      <button type="button" class="btn btn-danger" (click)="dialogRef.close(true)">
        Deletar
      </button>
    </div>
  `
})
export class WorkspaceDeleteDialogComponent {
  readonly data = inject<WorkspaceDeleteDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<WorkspaceDeleteDialogComponent>);
}
