import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TaskProgressService } from '@vectorseek/state';
import { GetProgressResponse, GeneratedDocument, GenerationError } from '@vectorseek/data-access';

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
  imports: [CommonModule],
  templateUrl: './generation-progress.component.html',
  styleUrls: ['./generation-progress.component.css']
})
export class GenerationProgressComponent implements OnInit, OnDestroy {
  @Input({ required: true }) taskId!: string;
  @Output() completed = new EventEmitter<GeneratedDocument>();
  @Output() failed = new EventEmitter<GenerationError>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly progressService = inject(TaskProgressService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  percentage = signal(0);
  message = signal('Iniciando...');
  stage = signal<'context' | 'rendering' | 'completed'>('context');
  eta = signal<number | null>(null);
  result = signal<GeneratedDocument | null>(null);
  error = signal<GenerationError | null>(null);

  ngOnInit(): void {
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

  onStopMonitoring(): void {
    this.progressService.stopMonitoring();
    this.cancelled.emit();
  }

  onRetry(): void {
    // Emit cancelled to let parent component restart the process
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
}
