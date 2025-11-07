import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ExportService } from '@vectorseek-platform/data-access';
import {
  ExportFormat,
  ExportLanguage,
  ExportQueueItem
} from '@vectorseek-platform/data-access';
import { ExportQueueComponent } from './export-queue.component';

/**
 * Componente de formulário de exportação (E3-A4)
 *
 * Features:
 * - Seleção de formato (PDF/DOCX)
 * - Configuração de idioma e opções
 * - Validação de formulário
 * - Iniciar exportação
 */
@Component({
  selector: 'app-export-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSnackBarModule,
    ExportQueueComponent
  ],
  template: `
    <div class="export-container">
      <mat-card class="export-form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>file_download</mat-icon>
            Exportar Documento
          </mat-card-title>
          <mat-card-subtitle>
            Escolha o formato e configure as opções de exportação
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="exportForm" (ngSubmit)="onSubmit()">
            <!-- Document Selection -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Documento</mat-label>
              <mat-select formControlName="documentId" required>
                <mat-option *ngFor="let doc of availableDocuments()" [value]="doc.id">
                  {{ doc.title }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="exportForm.get('documentId')?.hasError('required')">
                Selecione um documento
              </mat-error>
            </mat-form-field>

            <!-- Format Selection -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Formato</mat-label>
              <mat-select formControlName="format" required>
                <mat-option value="pdf">
                  <mat-icon>picture_as_pdf</mat-icon>
                  PDF
                </mat-option>
                <mat-option value="docx">
                  <mat-icon>description</mat-icon>
                  DOCX (Word)
                </mat-option>
              </mat-select>
              <mat-hint>Escolha o formato de exportação</mat-hint>
              <mat-error *ngIf="exportForm.get('format')?.hasError('required')">
                Selecione um formato
              </mat-error>
            </mat-form-field>

            <!-- Language Selection -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Idioma</mat-label>
              <mat-select formControlName="language">
                <mat-option value="pt-BR">Português (Brasil)</mat-option>
                <mat-option value="en-US">English (US)</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Advanced Options -->
            <div class="options-section">
              <h3>Opções Avançadas</h3>

              <div class="checkbox-group">
                <mat-checkbox formControlName="includeMetadata">
                  Incluir metadados
                </mat-checkbox>
                <mat-checkbox formControlName="includeTableOfContents">
                  Incluir índice (sumário)
                </mat-checkbox>
              </div>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Tamanho da Página</mat-label>
                <mat-select formControlName="pageSize">
                  <mat-option value="A4">A4</mat-option>
                  <mat-option value="Letter">Letter</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-radio-group formControlName="orientation" class="radio-group">
                <label>Orientação:</label>
                <mat-radio-button value="portrait">Retrato</mat-radio-button>
                <mat-radio-button value="landscape">Paisagem</mat-radio-button>
              </mat-radio-group>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-stroked-button type="button" (click)="onReset()">
            <mat-icon>refresh</mat-icon>
            Limpar
          </button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            (click)="onSubmit()"
            [disabled]="exportForm.invalid || submitting()"
          >
            <mat-icon>file_download</mat-icon>
            {{ submitting() ? 'Exportando...' : 'Exportar' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Export Queue -->
      <app-export-queue [queueItems]="queueItems()"></app-export-queue>
    </div>
  `,
  styles: [`
    .export-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      gap: 2rem;
    }

    .export-form-card {
      margin-bottom: 2rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .half-width {
      width: 48%;
      margin-bottom: 1rem;
    }

    .options-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .options-section h3 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .radio-group label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    mat-card-actions {
      padding: 1rem 1.5rem;
      display: flex;
      gap: 1rem;
    }
  `]
})
export class ExportFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly exportService = inject(ExportService);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal<boolean>(false);
  readonly queueItems = signal<ExportQueueItem[]>([]);
  readonly availableDocuments = signal<Array<{ id: string; title: string }>>([]);

  exportForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableDocuments();
  }

  private initForm(): void {
    this.exportForm = this.fb.group({
      documentId: ['', Validators.required],
      format: ['pdf', Validators.required],
      language: ['pt-BR'],
      includeMetadata: [true],
      includeTableOfContents: [true],
      pageSize: ['A4'],
      orientation: ['portrait']
    });
  }

  private loadAvailableDocuments(): void {
    // TODO: Load from service
    // For now, mock data
    this.availableDocuments.set([
      { id: '1', title: 'Documento de Exemplo 1' },
      { id: '2', title: 'Documento de Exemplo 2' },
      { id: '3', title: 'Documento de Exemplo 3' }
    ]);
  }

  onSubmit(): void {
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formValue = this.exportForm.value;
    const request = {
      documentId: formValue.documentId,
      format: formValue.format as ExportFormat,
      language: formValue.language as ExportLanguage,
      options: {
        includeMetadata: formValue.includeMetadata,
        includeTableOfContents: formValue.includeTableOfContents,
        pageSize: formValue.pageSize,
        orientation: formValue.orientation
      }
    };

    this.exportService.exportDocument(request).subscribe({
      next: (response) => {
        this.snackBar.open('Exportação iniciada com sucesso!', 'Fechar', {
          duration: 3000
        });

        // Add to queue
        const selectedDoc = this.availableDocuments().find(d => d.id === formValue.documentId);
        const queueItem: ExportQueueItem = {
          taskId: response.taskId,
          documentId: formValue.documentId,
          documentTitle: selectedDoc?.title || 'Documento',
          format: formValue.format,
          status: response.status,
          progress: 0,
          message: response.message,
          createdAt: new Date()
        };

        this.queueItems.update(items => [queueItem, ...items]);
        this.submitting.set(false);
        this.onReset();

        // Start polling for this task
        this.pollTaskStatus(response.taskId);
      },
      error: (err) => {
        this.snackBar.open(
          err.summary || 'Erro ao iniciar exportação',
          'Fechar',
          { duration: 5000 }
        );
        this.submitting.set(false);
      }
    });
  }

  private pollTaskStatus(taskId: string): void {
    this.exportService.pollExportStatus(taskId).subscribe({
      next: (status) => {
        this.queueItems.update(items =>
          items.map(item =>
            item.taskId === taskId
              ? {
                  ...item,
                  status: status.status,
                  progress: status.progress,
                  message: status.message,
                  downloadUrl: status.downloadUrl,
                  error: status.error
                }
              : item
          )
        );

        // If completed, show notification
        if (status.status === 'completed' && status.downloadUrl) {
          this.snackBar.open('Exportação concluída! Download disponível.', 'Fechar', {
            duration: 5000
          });
        } else if (status.status === 'failed') {
          this.snackBar.open('Falha na exportação: ' + status.error, 'Fechar', {
            duration: 5000
          });
        }
      },
      error: (err) => {
        console.error('Error polling task status:', err);
      }
    });
  }

  onReset(): void {
    this.exportForm.reset({
      format: 'pdf',
      language: 'pt-BR',
      includeMetadata: true,
      includeTableOfContents: true,
      pageSize: 'A4',
      orientation: 'portrait'
    });
  }
}
