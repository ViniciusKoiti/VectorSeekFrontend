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
  templateUrl: './template-step.component.html',
  styleUrls: ['./template-step.component.css']
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
