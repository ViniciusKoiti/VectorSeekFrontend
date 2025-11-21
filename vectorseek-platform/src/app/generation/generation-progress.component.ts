import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskProgressService } from '@vectorseek/state';
import {
  GenerationService,
  GetProgressResponse,
  GeneratedDocument,
  GenerationError
} from '@vectorseek/data-access';
import { CancelGenerationDialogComponent } from './cancel-generation-dialog.component';

/**
 * Componente para monitorar progresso de tarefas de geração
 * Conforme especificação E3-A2
 *
 * Features:
 * - Polling automático com backoff exponencial
 * - Exibição de etapas com porcentagem e ETA
 * - Tratamento de erros 404 (expiração)
 * - Cancelamento manual
 */
@Component({
  selector: 'app-generation-progress',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './generation-progress.component.html',
  styleUrls: ['./generation-progress.component.css']
})
export class GenerationProgressComponent implements OnInit, OnDestroy {
  @Input({ required: true }) taskId!: string;
  @Output() completed = new EventEmitter<GeneratedDocument>();
  @Output() failed = new EventEmitter<GenerationError>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly progressService = inject(TaskProgressService);
  private readonly generationService = inject(GenerationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Signals
  percentage = signal(0);
  message = signal('Iniciando...');
  stage = signal<'context' | 'rendering' | 'completed'>('context');
  eta = signal<number | null>(null);
  result = signal<GeneratedDocument | null>(null);
  error = signal<GenerationError | null>(null);
  isCancelling = signal(false);
  isCancelled = signal(false);

  ngOnInit(): void {
    this.isCancelled.set(false);
    this.startMonitoring();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.progressService.stopMonitoring();
  }

  private startMonitoring(): void {
    this.progressService
      .monitorProgress(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress: GetProgressResponse) => {
          this.percentage.set(progress.percentage);
          this.message.set(progress.message);
          this.stage.set(progress.stage);
          this.eta.set(progress.eta ?? null);

          if (progress.status === 'completed' && progress.result) {
            this.result.set(progress.result);
            this.completed.emit(progress.result);
          }

          if (progress.status === 'failed') {
            this.error.set({
              status: 500,
              code: 'generation_failed',
              summary: 'Falha na geração',
              description: progress.error ?? 'Erro desconhecido'
            });
            this.message.set(progress.error ?? 'Falha na geração');
            this.failed.emit(this.error()!);
          }
        },
        error: (err: GenerationError) => {
          this.error.set(err);
          this.message.set(err.description ?? err.summary);
          this.failed.emit(err);
        }
      });
  }

  onCancelClick(): void {
    if (this.isCancelling() || this.isCancelled() || this.isCompleted() || this.hasFailed()) {
      return;
    }

    this.dialog
      .open(CancelGenerationDialogComponent, {
        width: '420px',
        data: {
          title: 'Cancelar geração?',
          message: 'Você tem certeza que deseja cancelar esta geração? O progresso atual será perdido.',
          confirmLabel: 'Cancelar geração',
          cancelLabel: 'Continuar'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.requestCancellation();
        }
      });
  }

  onRetry(): void {
    this.isCancelled.set(false);
    this.cancelled.emit();
  }

  onViewResult(): void {
    if (this.result()) {
      this.completed.emit(this.result()!);
    }
  }

  isCompleted(): boolean {
    return this.stage() === 'completed' && this.percentage() === 100;
  }

  hasFailed(): boolean {
    return this.error() !== null;
  }

  isStageActive(stageName: string): boolean {
    return this.stage() === stageName;
  }

  isStageCompleted(stageName: string): boolean {
    const stages = ['context', 'rendering', 'completed'];
    const currentIndex = stages.indexOf(this.stage());
    const stageIndex = stages.indexOf(stageName);
    return currentIndex > stageIndex || (currentIndex === stageIndex && this.isCompleted());
  }

  getStatusIcon(): string {
    if (this.hasFailed()) return '❌';
    if (this.isCompleted()) return '✅';
    return '⏳';
  }

  getStageIcon(stageName: string): string {
    const icons: Record<string, string> = {
      context: '📝',
      rendering: '🎨',
      completed: '✅'
    };
    return icons[stageName] || '⚪';
  }

  formatEta(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  isCancelDisabled(): boolean {
    return this.isCancelling() || this.isCancelled();
  }

  private requestCancellation(): void {
    this.isCancelling.set(true);
    this.generationService
      .cancelGeneration(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isCancelling.set(false);
          this.isCancelled.set(true);
          this.message.set(response.message || 'Geração cancelada pelo usuário.');
          this.progressService.stopMonitoring();
          this.cancelled.emit();
        },
        error: (err: GenerationError) => {
          this.isCancelling.set(false);
          this.message.set(err.description ?? err.summary ?? 'Erro ao cancelar geração.');
        }
      });
  }
}
