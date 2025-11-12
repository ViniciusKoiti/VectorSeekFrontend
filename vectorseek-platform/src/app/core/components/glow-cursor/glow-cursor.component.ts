import { Component, HostListener, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-glow-cursor',
  standalone: true,
  template: '',
  styles: [`
    :host {
      position: fixed;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, var(--glow-cursor-color) 0%, transparent 80%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease-out;
    }
  `]
})
export class GlowCursorComponent {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.renderer.setStyle(this.el.nativeElement, 'transform', `translate(${event.clientX}px, ${event.clientY}px)`);
  }
}
