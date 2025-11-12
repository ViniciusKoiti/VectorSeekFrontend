import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typewriter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [innerHTML]="displayText"></span>
    <span class="cursor" [class.hidden]="!showCursor">|</span>
  `,
  styles: [`
    .cursor {
      animation: blink 1s step-start infinite;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }

    .cursor.hidden {
      display: none;
    }
  `]
})
export class TypewriterComponent implements OnInit, OnDestroy {
  phrases = [
    'Inteligência Artificial para suas demandas.',
    'Respostas rápidas e precisas.',
    'O futuro da busca de informações.'
  ];
  currentPhraseIndex = 0;
  currentText = '';
  displayText = '';
  showCursor = true;

  private typingSpeed = 100;
  private deletingSpeed = 50;
  private delayBetweenPhrases = 2000;
  private timeoutId: any;

  ngOnInit(): void {
    this.type();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeoutId);
  }

  private type(): void {
    const currentPhrase = this.phrases[this.currentPhraseIndex];
    if (this.currentText.length < currentPhrase.length) {
      this.currentText = currentPhrase.substring(0, this.currentText.length + 1);
      this.displayText = this.currentText;
      this.timeoutId = setTimeout(() => this.type(), this.typingSpeed);
    } else {
      this.showCursor = false;
      this.timeoutId = setTimeout(() => this.delete(), this.delayBetweenPhrases);
    }
  }

  private delete(): void {
    this.showCursor = true;
    if (this.currentText.length > 0) {
      this.currentText = this.currentText.substring(0, this.currentText.length - 1);
      this.displayText = this.currentText;
      this.timeoutId = setTimeout(() => this.delete(), this.deletingSpeed);
    } else {
      this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
      this.timeoutId = setTimeout(() => this.type(), this.typingSpeed);
    }
  }
}
