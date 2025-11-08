import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { formStepSchema, FormStepData, validateWithZod } from '../generation.validation';

/**
 * Componente do primeiro step do wizard: Formulário básico
 * Conforme especificação E3-A1
 */
@Component({
  selector: 'app-form-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-step.component.html',
  styleUrls: ['./form-step.component.css']
})
export class FormStepComponent {
  @Output() next = new EventEmitter<FormStepData>();

  formData: FormStepData = {
    title: '',
    briefing: '',
    modelOverride: undefined
  };

  errors = signal<Record<string, string>>({});

  onSubmit(): void {
    const validation = validateWithZod(formStepSchema, this.formData);

    if (!validation.success) {
      this.errors.set(validation.errors);
      return;
    }

    this.errors.set({});
    this.next.emit(validation.data);
  }

  setData(data: Partial<FormStepData>): void {
    this.formData = { ...this.formData, ...data };
  }
}
