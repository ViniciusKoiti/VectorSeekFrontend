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
  template: `
    <div class="progress-container">
      <!-- Header -->
      <div class="progress-header">
        <h3>Progresso da Geração</h3>
        @if (!isCompleted() && !hasFailed()) {
          <button (click)="onStopMonitoring()" class="btn-cancel" title="Parar acompanhamento">
            Cancelar
          </button>
        }
      </div>

      <!-- Progress Bar -->
      @if (!hasFailed()) {
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="percentage()"></div>
          </div>
          <span class="progress-percentage">{{ percentage() }}%</span>
        </div>
      }

      <!-- Status Message -->
      <div class="status-message" [class.error]="hasFailed()">
        <span class="status-icon">{{ getStatusIcon() }}</span>
        <span class="status-text">{{ message() }}</span>
      </div>

      <!-- Stages -->
      @if (!hasFailed()) {
        <div class="stages">
          <div class="stage" [class.active]="isStageActive('context')" [class.completed]="isStageCompleted('context')">
            <span class="stage-icon">{{ getStageIcon('context') }}</span>
            <span class="stage-label">Contexto</span>
          </div>
          <div class="stage-divider"></div>
          <div class="stage" [class.active]="isStageActive('rendering')" [class.completed]="isStageCompleted('rendering')">
            <span class="stage-icon">{{ getStageIcon('rendering') }}</span>
            <span class="stage-label">Renderização</span>
          </div>
          <div class="stage-divider"></div>
          <div class="stage" [class.active]="isStageActive('completed')" [class.completed]="isStageCompleted('completed')">
            <span class="stage-icon">{{ getStageIcon('completed') }}</span>
            <span class="stage-label">Concluído</span>
          </div>
        </div>
      }

      <!-- ETA -->
      @if (eta() && !isCompleted() && !hasFailed()) {
        <div class="eta">
          <span>Tempo estimado: {{ formatEta(eta()!) }}</span>
        </div>
      }

      <!-- Error Actions -->
      @if (hasFailed()) {
        <div class="error-actions">
          <button (click)="onRetry()" class="btn btn-primary">
            Reiniciar Processo
          </button>
        </div>
      }

      <!-- Success Actions -->
      @if (isCompleted() && result()) {
        <div class="success-actions">
          <button (click)="onViewResult()" class="btn btn-primary">
            Ver Resultado
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      max-width: 600px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .progress-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #1a1a1a;
    }

    .btn-cancel {
      background: none;
      border: 1px solid #dc3545;
      color: #dc3545;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #dc3545;
      color: white;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4a90e2, #357abd);
      transition: width 0.3s ease;
    }

    .progress-percentage {
      font-weight: 600;
      color: #4a90e2;
      min-width: 45px;
      text-align: right;
    }

    .status-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }

    .status-message.error {
      background: #fee;
      color: #dc3545;
    }

    .status-icon {
      font-size: 1.5rem;
    }

    .status-text {
      flex: 1;
      font-size: 0.9rem;
    }

    .stages {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      opacity: 0.4;
      transition: opacity 0.3s;
    }

    .stage.active {
      opacity: 1;
    }

    .stage.completed {
      opacity: 1;
      color: #28a745;
    }

    .stage-icon {
      font-size: 2rem;
    }

    .stage-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .stage-divider {
      flex: 1;
      height: 2px;
      background: #e0e0e0;
      margin: 0 0.5rem;
    }

    .eta {
      text-align: center;
      color: #666;
      font-size: 0.875rem;
      padding: 0.5rem;
    }

    .error-actions,
    .success-actions {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4a90e2;
      color: white;
    }

    .btn-primary:hover {
      background: #357abd;
    }
  `]
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
