import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="field-error" *ngIf="message">{{ message }}</p>
  `,
  styles: [
    `
      .field-error {
        color: #e53e3e;
        font-size: 0.875rem;
        margin: 0.25rem 0 0;
      }
    `
  ]
})
export class FieldErrorComponent {
  private internalMessages: string[] = [];

  @Input()
  set messages(value: string[] | null | undefined) {
    this.internalMessages = value ? [...value] : [];
  }

  get message(): string | null {
    return this.internalMessages.length > 0 ? this.internalMessages[0] : null;
  }
}
