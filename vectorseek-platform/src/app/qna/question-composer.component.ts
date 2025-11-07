import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Componente para composição de perguntas no Q&A
 * Conforme especificação E2-A1
 */
@Component({
  selector: 'app-question-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="question-composer">
      <div class="composer-header">
        <h2>Faça uma pergunta</h2>
        <p class="composer-description">
          Digite sua pergunta e nosso sistema buscará a melhor resposta em sua base de conhecimento
        </p>
      </div>

      <div class="composer-body">
        <textarea
          [(ngModel)]="questionText"
          (keydown)="onKeyDown($event)"
          placeholder="Digite sua pergunta aqui..."
          [disabled]="disabled()"
          rows="4"
          class="question-input"
        ></textarea>

        <div class="composer-actions">
          <button
            (click)="onClear()"
            [disabled]="disabled() || !questionText.trim()"
            class="btn btn-secondary"
            type="button"
          >
            Limpar
          </button>
          <button
            (click)="onAsk()"
            [disabled]="disabled() || !questionText.trim()"
            class="btn btn-primary"
            type="button"
          >
            @if (disabled()) {
              <span class="spinner"></span>
              Processando...
            } @else {
              Perguntar
            }
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="composer-error">
          <span class="error-icon">⚠️</span>
          <div class="error-content">
            <strong>{{ error()?.summary }}</strong>
            @if (error()?.description) {
              <p>{{ error()?.description }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .question-composer {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .composer-header h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        color: #1a1a1a;
      }

      .composer-description {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }

      .composer-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .question-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        min-height: 100px;
      }

      .question-input:focus {
        outline: none;
        border-color: #4a90e2;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
      }

      .question-input:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
      }

      .composer-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #4a90e2;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #357abd;
      }

      .btn-secondary {
        background: #f5f5f5;
        color: #666;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e0e0e0;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .composer-error {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background: #fff3f3;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        color: #c62828;
      }

      .error-icon {
        font-size: 1.25rem;
      }

      .error-content {
        flex: 1;
      }

      .error-content strong {
        display: block;
        margin-bottom: 0.25rem;
      }

      .error-content p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
      }
    `
  ]
})
export class QuestionComposerComponent {
  questionText = '';
  disabled = signal(false);
  error = signal<{ summary: string; description?: string } | null>(null);

  // Outputs
  askQuestion = output<string>();
  clearQuestion = output<void>();

  onAsk(): void {
    const question = this.questionText.trim();
    if (question) {
      this.askQuestion.emit(question);
    }
  }

  onClear(): void {
    this.questionText = '';
    this.error.set(null);
    this.clearQuestion.emit();
  }

  onKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      this.onAsk();
    }
  }

  setDisabled(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  setError(error: { summary: string; description?: string } | null): void {
    this.error.set(error);
  }

  clear(): void {
    this.questionText = '';
    this.error.set(null);
  }
}
