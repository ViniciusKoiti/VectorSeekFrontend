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
  template: `
    <div class="wizard-container">
      <div class="wizard-header">
        <h1>Geração de Conteúdo</h1>
        <p class="subtitle">Crie documentos personalizados em minutos</p>
      </div>

      @if (!showProgress() && !showResult()) {
        <mat-stepper #stepper linear>
          <!-- Step 1: Form -->
          <mat-step [completed]="formData() !== null">
            <ng-template matStepLabel>Informações</ng-template>
            <app-form-step
              (next)="onFormNext($event)"
            />
          </mat-step>

          <!-- Step 2: Template -->
          <mat-step [completed]="templateData() !== null">
            <ng-template matStepLabel>Template</ng-template>
            <app-template-step
              (next)="onTemplateNext($event)"
              (back)="stepper.previous()"
            />
          </mat-step>

          <!-- Step 3: Review -->
          <mat-step>
            <ng-template matStepLabel>Revisão</ng-template>
            @if (getWizardData()) {
              <app-review-step
                [wizardData]="getWizardData()!"
                [templateName]="selectedTemplateName()"
                [generating]="generating()"
                (generate)="onGenerate()"
                (back)="stepper.previous()"
              />
            }
          </mat-step>
        </mat-stepper>
      }

      <!-- Progress View -->
      @if (showProgress() && taskId()) {
        <div class="progress-view">
          <app-generation-progress
            [taskId]="taskId()!"
            (completed)="onGenerationCompleted($event)"
            (failed)="onGenerationFailed($event)"
            (cancelled)="onGenerationCancelled()"
          />
        </div>
      }

      <!-- Result View -->
      @if (showResult() && result()) {
        <div class="result-view">
          <div class="result-header">
            <h2>✅ Documento Gerado com Sucesso!</h2>
            <p class="subtitle">Seu documento está pronto para uso</p>
          </div>

          <div class="result-info">
            <div class="info-item">
              <strong>Título:</strong> {{ result()!.title }}
            </div>
            @if (result()!.metadata) {
              <div class="info-item">
                <strong>Modelo:</strong> {{ result()!.metadata!.modelUsed || 'Padrão' }}
              </div>
              @if (result()!.metadata!.tokensUsed) {
                <div class="info-item">
                  <strong>Tokens:</strong>
                  {{ result()!.metadata!.tokensUsed!.input + result()!.metadata!.tokensUsed!.output }}
                  ({{ result()!.metadata!.tokensUsed!.input }} input + {{ result()!.metadata!.tokensUsed!.output }} output)
                </div>
              }
            }
          </div>

          <div class="result-content">
            <div class="content-header">
              <h3>Conteúdo Gerado</h3>
              <div class="content-actions">
                <button (click)="copyToClipboard()" class="btn btn-secondary">
                  📋 Copiar
                </button>
                <button (click)="downloadMarkdown()" class="btn btn-secondary">
                  📥 Baixar Markdown
                </button>
              </div>
            </div>
            <div class="content-preview">
              <pre>{{ result()!.content }}</pre>
            </div>
          </div>

          @if (copySuccess()) {
            <div class="success-message">
              ✅ Conteúdo copiado para a área de transferência!
            </div>
          }

          <div class="result-actions">
            <button (click)="startNewGeneration()" class="btn btn-primary">
              ➕ Nova Geração
            </button>
          </div>
        </div>
      }

      <!-- Error View -->
      @if (error()) {
        <div class="error-view">
          <div class="error-icon">❌</div>
          <h2>{{ error()!.summary }}</h2>
          <p>{{ error()!.description }}</p>
          <button (click)="clearError()" class="btn btn-primary">
            Tentar Novamente
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .wizard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .wizard-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .wizard-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
      color: #1a1a1a;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .progress-view {
      display: flex;
      justify-content: center;
      padding: 2rem 0;
    }

    .result-view {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .result-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .result-header h2 {
      margin: 0 0 0.5rem 0;
      color: #28a745;
      font-size: 2rem;
    }

    .result-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .info-item {
      font-size: 0.9rem;
    }

    .info-item strong {
      display: inline-block;
      margin-right: 0.5rem;
      color: #666;
    }

    .result-content {
      margin-bottom: 2rem;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .content-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #1a1a1a;
    }

    .content-actions {
      display: flex;
      gap: 0.5rem;
    }

    .content-preview {
      max-height: 500px;
      overflow-y: auto;
      padding: 1.5rem;
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .content-preview pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .success-message {
      padding: 1rem;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
    }

    .result-actions {
      display: flex;
      justify-content: center;
      padding-top: 1rem;
    }

    .error-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .error-view h2 {
      margin: 0 0 0.5rem 0;
      color: #dc3545;
    }

    .error-view p {
      margin: 0 0 2rem 0;
      color: #666;
    }

    .btn {
      padding: 0.75rem 1.5rem;
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

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    ::ng-deep .mat-stepper-horizontal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
  `]
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
