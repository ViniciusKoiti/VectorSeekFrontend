import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-upload-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.css']
})
export class UploadProgressComponent {
  private readonly internalProgress = signal(0);

  @Input()
  set progress(value: number) {
    const normalized = Math.min(100, Math.max(0, value || 0));
    this.internalProgress.set(normalized);
  }

  get progress(): number {
    return this.internalProgress();
  }

  @Input() status: string | null = null;
  @Input() indeterminate = false;

  readonly progressLabel = computed(() => `${this.internalProgress()}%`);
}
