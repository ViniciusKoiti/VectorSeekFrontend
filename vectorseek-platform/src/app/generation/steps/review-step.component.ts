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
  templateUrl: './review-step.component.html',
  styleUrls: ['./review-step.component.css']
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
