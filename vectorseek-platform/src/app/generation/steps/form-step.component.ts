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
  template: `
    <div class="form-step">
      <h2>Informações Básicas</h2>
      <p class="subtitle">Preencha as informações principais do documento</p>

      <form (ngSubmit)="onSubmit()" #form="ngForm">
        <!-- Title -->
        <div class="form-group">
          <label for="title">
            Título <span class="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            [(ngModel)]="formData.title"
            placeholder="Ex: Artigo sobre IA"
            class="form-control"
            [class.error]="errors()['title']"
            required
          />
          @if (errors()['title']) {
            <span class="error-message">{{ errors()['title'] }}</span>
          }
        </div>

        <!-- Briefing -->
        <div class="form-group">
          <label for="briefing">
            Briefing <span class="required">*</span>
          </label>
          <textarea
            id="briefing"
            name="briefing"
            [(ngModel)]="formData.briefing"
            placeholder="Descreva o que deseja gerar..."
            rows="8"
            class="form-control"
            [class.error]="errors()['briefing']"
            required
          ></textarea>
          <small class="help-text">
            Mínimo 10 caracteres, máximo 5000 caracteres
          </small>
          @if (errors()['briefing']) {
            <span class="error-message">{{ errors()['briefing'] }}</span>
          }
        </div>

        <!-- Model Override (opcional) -->
        <div class="form-group">
          <label for="modelOverride">
            Modelo (opcional)
          </label>
          <select
            id="modelOverride"
            name="modelOverride"
            [(ngModel)]="formData.modelOverride"
            class="form-control"
          >
            <option value="">Padrão do sistema</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3">Claude 3</option>
          </select>
          <small class="help-text">
            Escolha um modelo específico ou use o padrão
          </small>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            Próximo
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-step {
      max-width: 700px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 0.5rem 0;
      color: #1a1a1a;
      font-size: 1.75rem;
    }

    .subtitle {
      margin: 0 0 2rem 0;
      color: #666;
      font-size: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .required {
      color: #dc3545;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #4a90e2;
    }

    .form-control.error {
      border-color: #dc3545;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 150px;
    }

    .help-text {
      display: block;
      margin-top: 0.25rem;
      color: #999;
      font-size: 0.875rem;
    }

    .error-message {
      display: block;
      margin-top: 0.25rem;
      color: #dc3545;
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 0.75rem 2rem;
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
