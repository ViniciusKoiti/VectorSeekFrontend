import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardData } from '../generation.validation';

/**
 * Componente do terceiro step do wizard: Revisão e confirmação
 * Conforme especificação E3-A1
 */
@Component({
  selector: 'app-review-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="review-step">
      <h2>Revise as Informações</h2>
      <p class="subtitle">Confirme os dados antes de iniciar a geração</p>

      <div class="review-sections">
        <!-- Informações Básicas -->
        <div class="review-section">
          <h3>Informações Básicas</h3>
          <div class="review-item">
            <span class="review-label">Título:</span>
            <span class="review-value">{{ wizardData.title }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Briefing:</span>
            <div class="review-value briefing-preview">
              {{ wizardData.briefing }}
            </div>
          </div>
          @if (wizardData.modelOverride) {
            <div class="review-item">
              <span class="review-label">Modelo:</span>
              <span class="review-value">{{ wizardData.modelOverride }}</span>
            </div>
          }
        </div>

        <!-- Template -->
        <div class="review-section">
          <h3>Template</h3>
          <div class="review-item">
            <span class="review-label">Template ID:</span>
            <span class="review-value">{{ wizardData.templateId }}</span>
          </div>
          @if (templateName) {
            <div class="review-item">
              <span class="review-label">Nome:</span>
              <span class="review-value">{{ templateName }}</span>
            </div>
          }
        </div>

        <!-- Variáveis Customizadas -->
        @if (hasCustomVariables()) {
          <div class="review-section">
            <h3>Variáveis Customizadas</h3>
            @for (variable of getCustomVariablesArray(); track variable.key) {
              <div class="review-item">
                <span class="review-label">{{ variable.key }}:</span>
                <span class="review-value">{{ variable.value }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">ℹ️</div>
        <div class="info-content">
          <strong>Importante:</strong> A geração pode levar alguns minutos dependendo da complexidade do documento.
          Você poderá acompanhar o progresso em tempo real.
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button (click)="onBack()" class="btn btn-secondary" [disabled]="generating">
          Voltar
        </button>
        <button
          (click)="onGenerate()"
          class="btn btn-primary"
          [disabled]="generating"
        >
          @if (generating) {
            <span class="spinner-small"></span>
            <span>Iniciando...</span>
          } @else {
            <span>Gerar Documento</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .review-step {
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

    .review-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .review-section {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .review-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: #1a1a1a;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .review-item {
      display: flex;
      margin-bottom: 0.75rem;
      gap: 1rem;
    }

    .review-item:last-child {
      margin-bottom: 0;
    }

    .review-label {
      font-weight: 500;
      color: #666;
      min-width: 120px;
    }

    .review-value {
      flex: 1;
      color: #1a1a1a;
    }

    .briefing-preview {
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 4px;
      margin-bottom: 2rem;
    }

    .info-icon {
      font-size: 1.5rem;
    }

    .info-content {
      flex: 1;
      color: #1565c0;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .info-content strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .btn-secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ReviewStepComponent {
  @Input({ required: true }) wizardData!: WizardData;
  @Input() templateName?: string;
  @Input() generating = false;

  @Output() generate = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  hasCustomVariables(): boolean {
    return !!(
      this.wizardData.customVariables &&
      Object.keys(this.wizardData.customVariables).length > 0
    );
  }

  getCustomVariablesArray(): Array<{ key: string; value: string | number }> {
    if (!this.wizardData.customVariables) {
      return [];
    }

    return Object.entries(this.wizardData.customVariables).map(([key, value]) => ({
      key,
      value
    }));
  }

  onBack(): void {
    this.back.emit();
  }

  onGenerate(): void {
    this.generate.emit();
  }
}
