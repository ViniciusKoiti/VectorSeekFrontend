import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightTermsPipe } from './pipes/highlight-terms.pipe';

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  chunkText: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface Answer {
  text: string;
  citations: Citation[];
  modelUsed?: string;
  provider?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * Componente para exibir respostas e citações do Q&A
 * Conforme especificações E2-A1 e E2-A2
 */
@Component({
  selector: 'app-answer-panel',
  standalone: true,
  imports: [CommonModule, HighlightTermsPipe],
  templateUrl: './answer-panel.component.html',
  styleUrls: ['./answer-panel.component.css']
})
export class AnswerPanelComponent {
  answer = input.required<Answer | null>();
  searchTerms = input<string[]>([]);

  // Outputs
  copyAnswer = output<void>();
  requestFeedback = output<void>();

  // State
  expandedCitations = signal(new Set<string>());
  copySuccess = signal(false);

  // Helper for template
  readonly Object = Object;

  toggleCitation(citationId: string): void {
    this.expandedCitations.update((expanded) => {
      const newSet = new Set(expanded);
      if (newSet.has(citationId)) {
        newSet.delete(citationId);
      } else {
        newSet.add(citationId);
      }
      return newSet;
    });
  }

  onCopy(): void {
    const answerText = this.answer()?.text;
    if (answerText) {
      navigator.clipboard.writeText(answerText).then(() => {
        this.copySuccess.set(true);
        this.copyAnswer.emit();

        // Hide notification after 3 seconds
        setTimeout(() => {
          this.copySuccess.set(false);
        }, 3000);
      });
    }
  }

  onFeedback(): void {
    this.requestFeedback.emit();
  }
}
