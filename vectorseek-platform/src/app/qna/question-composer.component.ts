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
  templateUrl: './question-composer.component.html',
  styleUrls: ['./question-composer.component.css']
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
