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
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css']
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
