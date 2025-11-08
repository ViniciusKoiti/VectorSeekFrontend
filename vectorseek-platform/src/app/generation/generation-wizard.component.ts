import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { GenerationService, GeneratedDocument, GenerationError, Template } from '@vectorseek/data-access';

import { FormStepComponent } from './steps/form-step.component';
import { TemplateStepComponent } from './steps/template-step.component';
import { ReviewStepComponent } from './steps/review-step.component';
import { GenerationProgressComponent } from './generation-progress.component';
import { FormStepData, TemplateStepData, WizardData } from './generation.validation';

/**
 * Componente principal do wizard de geração
 * Conforme especificação E3-A1
 *
 * Features:
 * - Wizard de 3 etapas com MatStepper
 * - Validação com Zod
 * - Integração com GenerationService
 * - Monitoramento de progresso
 * - Exibição de resultado com opção de copiar/baixar
 */
@Component({
  selector: 'app-generation-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    FormStepComponent,
    TemplateStepComponent,
    ReviewStepComponent,
    GenerationProgressComponent
  ],
  templateUrl: './generation-wizard.component.html',
  styleUrls: ['./generation-wizard.component.css']
})
export class GenerationWizardComponent {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly generationService = inject(GenerationService);

  // Signals
  formData = signal<FormStepData | null>(null);
  templateData = signal<TemplateStepData | null>(null);
  selectedTemplateName = signal<string | undefined>(undefined);
  generating = signal(false);
  showProgress = signal(false);
  showResult = signal(false);
  taskId = signal<string | null>(null);
  result = signal<GeneratedDocument | null>(null);
  error = signal<GenerationError | null>(null);
  copySuccess = signal(false);

  onFormNext(data: FormStepData): void {
    this.formData.set(data);
    this.stepper.next();
  }

  onTemplateNext(data: TemplateStepData): void {
    this.templateData.set(data);
    this.stepper.next();
  }

  getWizardData(): WizardData | null {
    const form = this.formData();
    const template = this.templateData();

    if (!form || !template) {
      return null;
    }

    return {
      title: form.title,
      briefing: form.briefing,
      templateId: template.templateId,
      customVariables: template.customVariables,
      modelOverride: form.modelOverride
    };
  }

  onGenerate(): void {
    const wizardData = this.getWizardData();
    if (!wizardData) {
      return;
    }

    this.generating.set(true);
    this.error.set(null);

    this.generationService.generateDocument(wizardData).subscribe({
      next: (response) => {
        this.generating.set(false);
        this.taskId.set(response.taskId);
        this.showProgress.set(true);
      },
      error: (err: GenerationError) => {
        this.generating.set(false);
        this.error.set(err);
      }
    });
  }

  onGenerationCompleted(document: GeneratedDocument): void {
    this.result.set(document);
    this.showProgress.set(false);
    this.showResult.set(true);
  }

  onGenerationFailed(err: GenerationError): void {
    this.error.set(err);
    this.showProgress.set(false);
  }

  onGenerationCancelled(): void {
    this.showProgress.set(false);
    this.error.set(null);
  }

  copyToClipboard(): void {
    if (!this.result()) {
      return;
    }

    navigator.clipboard.writeText(this.result()!.content).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }

  downloadMarkdown(): void {
    if (!this.result()) {
      return;
    }

    const blob = new Blob([this.result()!.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.result()!.title}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  startNewGeneration(): void {
    this.formData.set(null);
    this.templateData.set(null);
    this.selectedTemplateName.set(undefined);
    this.generating.set(false);
    this.showProgress.set(false);
    this.showResult.set(false);
    this.taskId.set(null);
    this.result.set(null);
    this.error.set(null);
    this.stepper.reset();
  }

  clearError(): void {
    this.error.set(null);
  }
}
