import { Component, OnDestroy, OnInit, ElementRef, ViewChild, Renderer2, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

/**
 * AuthLayoutComponent - Layout placeholder para páginas de autenticação
 * 
 * Compatível com SSR conforme definido no ADR-001 e E1-A1-1.
 * Este componente serve como container para as rotas filhas de autenticação.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ThemeToggleComponent],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('stars') stars!: ElementRef;
  @ViewChild('stars2') stars2!: ElementRef;
  @ViewChild('stars3') stars3!: ElementRef;

  private prefersReducedMotion = false;
  private isBrowser = false;

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    console.info('AuthLayoutComponent inicializado');
    if (this.isBrowser) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  ngOnDestroy(): void {
    console.info('AuthLayoutComponent destruído');
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.prefersReducedMotion || !this.isBrowser || window.innerWidth < 768) {
      return;
    }

    const { clientX, clientY } = event;
    const x = clientX / window.innerWidth - 0.5;
    const y = clientY / window.innerHeight - 0.5;

    requestAnimationFrame(() => {
      this.renderer.setStyle(this.stars.nativeElement, 'transform', `translate(${-x * 20}px, ${-y * 20}px)`);
      this.renderer.setStyle(this.stars2.nativeElement, 'transform', `translate(${-x * 40}px, ${-y * 40}px)`);
      this.renderer.setStyle(this.stars3.nativeElement, 'transform', `translate(${-x * 60}px, ${-y * 60}px)`);
    });
  }
}

