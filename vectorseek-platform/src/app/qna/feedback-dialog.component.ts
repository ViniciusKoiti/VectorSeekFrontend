import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface FeedbackFormData {
  rating: number;
  comment?: string;
}

/**
 * Modal de feedback para respostas do Q&A
 * Conforme especificação E2-A4
 */
@Component({
  selector: 'app-feedback-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="feedback-overlay" (click)="onCancel()">
      <div class="feedback-dialog" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="feedback-title" aria-modal="true">
        <div class="dialog-header">
          <h3 id="feedback-title">Avaliar Resposta</h3>
          <button
            (click)="onCancel()"
            class="btn-close"
            aria-label="Fechar modal"
            type="button"
          >
            ✕
          </button>
        </div>

        <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()">
          <div class="dialog-content">
            <div class="form-group">
              <label for="rating" class="form-label required">
                Como você avalia esta resposta?
              </label>
              <div class="rating-stars" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
                @for (star of [1, 2, 3, 4, 5]; track star) {
                  <button
                    type="button"
                    class="star-button"
                    [class.active]="(feedbackForm.value.rating || 0) >= star"
                    [class.hover]="hoverRating() >= star"
                    (click)="setRating(star)"
                    (mouseenter)="setHoverRating(star)"
                    (mouseleave)="setHoverRating(0)"
                    [attr.aria-label]="star + ' estrela' + (star > 1 ? 's' : '')"
                    [attr.aria-checked]="feedbackForm.value.rating === star"
                    role="radio"
                  >
                    {{ (feedbackForm.value.rating || 0) >= star || hoverRating() >= star ? '★' : '☆' }}
                  </button>
                }
              </div>
              @if (feedbackForm.controls.rating.invalid && feedbackForm.controls.rating.touched) {
                <div class="form-error" role="alert">
                  Por favor, selecione uma avaliação
                </div>
              }
            </div>

            <div class="form-group">
              <label for="comment" class="form-label">
                Comentários adicionais (opcional)
              </label>
              <textarea
                id="comment"
                formControlName="comment"
                placeholder="Compartilhe sua opinião sobre a resposta..."
                rows="4"
                class="form-textarea"
                [attr.aria-invalid]="feedbackForm.controls.comment.invalid && feedbackForm.controls.comment.touched"
              ></textarea>
              @if (feedbackForm.controls.comment.invalid && feedbackForm.controls.comment.touched) {
                <div class="form-error" role="alert">
                  {{ getCommentError() }}
                </div>
              }
            </div>

            @if (error()) {
              <div class="dialog-error" role="alert">
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

          <div class="dialog-actions">
            <button
              type="button"
              (click)="onCancel()"
              class="btn btn-secondary"
              [disabled]="loading()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="loading() || feedbackForm.invalid"
            >
              @if (loading()) {
                <span class="spinner"></span>
                Enviando...
              } @else {
                Enviar Feedback
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .feedback-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }

      .feedback-dialog {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
      }

      .dialog-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #1a1a1a;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        transition: color 0.2s;
      }

      .btn-close:hover {
        color: #333;
      }

      .btn-close:focus {
        outline: 2px solid #4a90e2;
        outline-offset: 2px;
        border-radius: 4px;
      }

      .dialog-content {
        padding: 1.5rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }

      .form-label.required::after {
        content: ' *';
        color: #d32f2f;
      }

      .rating-stars {
        display: flex;
        gap: 0.5rem;
      }

      .star-button {
        background: none;
        border: none;
        font-size: 2rem;
        color: #ccc;
        cursor: pointer;
        transition: all 0.2s;
        padding: 0.25rem;
        line-height: 1;
      }

      .star-button.active,
      .star-button.hover {
        color: #ffc107;
      }

      .star-button:hover {
        transform: scale(1.1);
      }

      .star-button:focus {
        outline: 2px solid #4a90e2;
        outline-offset: 2px;
        border-radius: 4px;
      }

      .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        min-height: 100px;
      }

      .form-textarea:focus {
        outline: none;
        border-color: #4a90e2;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
      }

      .form-textarea[aria-invalid='true'] {
        border-color: #d32f2f;
      }

      .form-error {
        margin-top: 0.5rem;
        color: #d32f2f;
        font-size: 0.875rem;
      }

      .dialog-error {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background: #fff3f3;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        color: #c62828;
        margin-top: 1rem;
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

      .dialog-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding: 1.5rem;
        border-top: 1px solid #e0e0e0;
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

      .btn:focus {
        outline: 2px solid #4a90e2;
        outline-offset: 2px;
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
    `
  ]
})
export class FeedbackDialogComponent {
  // Outputs
  submitFeedback = output<FeedbackFormData>();
  cancel = output<void>();

  // State
  loading = signal(false);
  error = signal<{ summary: string; description?: string } | null>(null);
  hoverRating = signal(0);

  // Form
  feedbackForm = new FormGroup({
    rating: new FormControl<number>(0, [Validators.required, Validators.min(1), Validators.max(5)]),
    comment: new FormControl<string>('', [Validators.maxLength(500)])
  });

  setRating(rating: number): void {
    this.feedbackForm.patchValue({ rating });
    this.feedbackForm.controls.rating.markAsTouched();
  }

  setHoverRating(rating: number): void {
    this.hoverRating.set(rating);
  }

  onSubmit(): void {
    if (this.feedbackForm.valid) {
      const formData: FeedbackFormData = {
        rating: this.feedbackForm.value.rating || 0,
        comment: this.feedbackForm.value.comment || undefined
      };
      this.submitFeedback.emit(formData);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setError(error: { summary: string; description?: string } | null): void {
    this.error.set(error);
  }

  getCommentError(): string {
    const control = this.feedbackForm.controls.comment;
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `O comentário deve ter no máximo ${maxLength} caracteres`;
    }
    return '';
  }
}
