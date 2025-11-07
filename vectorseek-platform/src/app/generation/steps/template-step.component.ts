import { Component, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenerationService, Template } from '@vectorseek/data-access';
import {
  templateStepSchema,
  TemplateStepData,
  validateWithZod,
  validateTemplateVariables
} from '../generation.validation';

/**
 * Componente do segundo step do wizard: Seleção de template
 * Conforme especificação E3-A1
 */
@Component({
  selector: 'app-template-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="template-step">
      <h2>Selecione um Template</h2>
      <p class="subtitle">Escolha o formato do documento que deseja gerar</p>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando templates...</p>
        </div>
      }

      @if (error()) {
        <div class="error-box">
          <p>{{ error() }}</p>
          <button (click)="loadTemplates()" class="btn btn-secondary">
            Tentar Novamente
          </button>
        </div>
      }

      @if (!loading() && !error()) {
        <!-- Template Selection -->
        <div class="templates-grid">
          @for (template of templates(); track template.id) {
            <div
              class="template-card"
              [class.selected]="selectedTemplateId() === template.id"
              (click)="selectTemplate(template)"
            >
              <h3>{{ template.name }}</h3>
              <p class="template-description">{{ template.description }}</p>
              <span class="template-category">{{ template.category }}</span>
            </div>
          }
        </div>

        <!-- Template Variables -->
        @if (selectedTemplate()) {
          <div class="variables-section">
            <h3>Variáveis do Template</h3>
            <p class="subtitle-small">Preencha as variáveis customizadas</p>

            <form #form="ngForm">
              @for (variable of selectedTemplate()!.variables; track variable.name) {
                <div class="form-group">
                  <label [for]="variable.name">
                    {{ variable.label }}
                    @if (variable.required) {
                      <span class="required">*</span>
                    }
                  </label>

                  @if (variable.description) {
                    <small class="help-text">{{ variable.description }}</small>
                  }

                  <!-- Text input -->
                  @if (variable.type === 'text') {
                    <input
                      type="text"
                      [id]="variable.name"
                      [name]="variable.name"
                      [(ngModel)]="customVariables[variable.name]"
                      [placeholder]="variable.defaultValue?.toString() || ''"
                      class="form-control"
                      [class.error]="variableErrors()[variable.name]"
                    />
                  }

                  <!-- Textarea -->
                  @if (variable.type === 'textarea') {
                    <textarea
                      [id]="variable.name"
                      [name]="variable.name"
                      [(ngModel)]="customVariables[variable.name]"
                      [placeholder]="variable.defaultValue?.toString() || ''"
                      rows="4"
                      class="form-control"
                      [class.error]="variableErrors()[variable.name]"
                    ></textarea>
                  }

                  <!-- Number input -->
                  @if (variable.type === 'number') {
                    <input
                      type="number"
                      [id]="variable.name"
                      [name]="variable.name"
                      [(ngModel)]="customVariables[variable.name]"
                      [placeholder]="variable.defaultValue?.toString() || ''"
                      class="form-control"
                      [class.error]="variableErrors()[variable.name]"
                    />
                  }

                  <!-- Select -->
                  @if (variable.type === 'select' && variable.options) {
                    <select
                      [id]="variable.name"
                      [name]="variable.name"
                      [(ngModel)]="customVariables[variable.name]"
                      class="form-control"
                      [class.error]="variableErrors()[variable.name]"
                    >
                      <option value="">Selecione...</option>
                      @for (option of variable.options; track option) {
                        <option [value]="option">{{ option }}</option>
                      }
                    </select>
                  }

                  @if (variableErrors()[variable.name]) {
                    <span class="error-message">{{ variableErrors()[variable.name] }}</span>
                  }
                </div>
              }
            </form>
          </div>
        }

        <!-- Actions -->
        <div class="form-actions">
          <button (click)="onBack()" class="btn btn-secondary">
            Voltar
          </button>
          <button
            (click)="onNext()"
            class="btn btn-primary"
            [disabled]="!selectedTemplateId()"
          >
            Próximo
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .template-step {
      max-width: 900px;
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

    .subtitle-small {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(74, 144, 226, 0.2);
      border-top-color: #4a90e2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-box {
      padding: 1.5rem;
      background: #fee;
      border: 1px solid #dc3545;
      border-radius: 4px;
      text-align: center;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .template-card {
      padding: 1.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .template-card:hover {
      border-color: #4a90e2;
      box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
    }

    .template-card.selected {
      border-color: #4a90e2;
      background: #f0f8ff;
    }

    .template-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: #1a1a1a;
    }

    .template-description {
      margin: 0 0 0.75rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .template-category {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #e0e0e0;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
    }

    .variables-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .variables-section h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      color: #1a1a1a;
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

    .help-text {
      display: block;
      margin-bottom: 0.5rem;
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
      justify-content: space-between;
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

    .btn:disabled {
      opacity: 0.5;
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

    .btn-secondary:hover {
      background: #e0e0e0;
    }
  `]
})
export class TemplateStepComponent implements OnInit {
  @Output() next = new EventEmitter<TemplateStepData>();
  @Output() back = new EventEmitter<void>();

  private readonly generationService = inject(GenerationService);

  templates = signal<Template[]>([]);
  selectedTemplateId = signal<string | null>(null);
  selectedTemplate = signal<Template | null>(null);
  customVariables: Record<string, string | number> = {};
  variableErrors = signal<Record<string, string>>({});
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.error.set(null);

    this.generationService.listTemplates().subscribe({
      next: (response) => {
        this.templates.set(response.templates);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.summary || 'Erro ao carregar templates');
        this.loading.set(false);
      }
    });
  }

  selectTemplate(template: Template): void {
    this.selectedTemplateId.set(template.id);
    this.selectedTemplate.set(template);
    this.customVariables = {};
    this.variableErrors.set({});

    // Set default values
    template.variables.forEach((variable) => {
      if (variable.defaultValue !== undefined) {
        this.customVariables[variable.name] = variable.defaultValue;
      }
    });
  }

  onBack(): void {
    this.back.emit();
  }

  onNext(): void {
    if (!this.selectedTemplateId()) {
      return;
    }

    // Validate template variables
    const template = this.selectedTemplate();
    if (template) {
      const errors = validateTemplateVariables(template.variables, this.customVariables);
      if (Object.keys(errors).length > 0) {
        this.variableErrors.set(errors);
        return;
      }
    }

    const data: TemplateStepData = {
      templateId: this.selectedTemplateId()!,
      customVariables: this.customVariables
    };

    const validation = validateWithZod(templateStepSchema, data);
    if (!validation.success) {
      return;
    }

    this.variableErrors.set({});
    this.next.emit(validation.data);
  }

  setData(data: Partial<TemplateStepData>): void {
    if (data.templateId) {
      const template = this.templates().find((t) => t.id === data.templateId);
      if (template) {
        this.selectTemplate(template);
      }
    }
    if (data.customVariables) {
      this.customVariables = { ...data.customVariables };
    }
  }
}
