import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Workspace } from '@vectorseek/data-access/lib/workspaces/workspaces.models';

export interface WorkspaceFormDialogData {
  mode: 'create' | 'edit';
  workspace?: Workspace;
}

export interface WorkspaceFormDialogResult {
  name: string;
  description?: string | null;
}

@Component({
  selector: 'app-workspace-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Novo workspace' : 'Editar workspace' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" mat-dialog-content>
      <label class="field-label" for="workspace-name">Nome</label>
      <input
        id="workspace-name"
        type="text"
        formControlName="name"
        maxlength="100"
        required
      />
      <div class="field-hint" *ngIf="form.controls.name.invalid && form.controls.name.touched">
        O nome é obrigatório (1-100 caracteres).
      </div>

      <label class="field-label" for="workspace-description">Descrição</label>
      <textarea
        id="workspace-description"
        formControlName="description"
        maxlength="500"
        rows="3"
      ></textarea>
      <div class="field-hint" *ngIf="form.controls.description.invalid && form.controls.description.touched">
        A descrição pode ter no máximo 500 caracteres.
      </div>
    </form>

    <div mat-dialog-actions align="end">
      <button type="button" class="btn btn-secondary" (click)="dialogRef.close()">
        Cancelar
      </button>
      <button
        type="button"
        class="btn btn-primary"
        [disabled]="form.invalid"
        (click)="onSubmit()"
      >
        {{ data.mode === 'create' ? 'Criar workspace' : 'Salvar alterações' }}
      </button>
    </div>
  `,
  styles: [
    `
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .field-label {
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      input,
      textarea {
        width: 100%;
        border: 1px solid var(--accent-primary-border);
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        font-size: 1rem;
        background: var(--background-elevated);
        color: var(--text-primary);
      }
      .field-hint {
        font-size: 0.85rem;
        color: var(--error-primary);
      }
      [mat-dialog-actions] {
        margin-top: 1rem;
      }
    `
  ]
})
export class WorkspaceFormDialogComponent {
  readonly data = inject<WorkspaceFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<WorkspaceFormDialogComponent, WorkspaceFormDialogResult | undefined>);

  form = new FormGroup({
    name: new FormControl(this.data.workspace?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1), Validators.maxLength(100)]
    }),
    description: new FormControl(this.data.workspace?.description ?? '', {
      validators: [Validators.maxLength(500)]
    })
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    this.dialogRef.close({
      name: value.name?.trim() ?? '',
      description: value.description?.trim() ? value.description.trim() : undefined
    });
  }
}
