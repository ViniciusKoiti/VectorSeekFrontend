import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * AuthLayoutComponent - Layout placeholder para páginas de autenticação
 * 
 * Compatível com SSR conforme definido no ADR-001 e E1-A1-1.
 * Este componente serve como container para as rotas filhas de autenticação.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <section class="auth-shell">
      <header class="auth-header">
        <h2>Área de autenticação</h2>
        <p>Acesse ou cadastre-se para continuar.</p>
      </header>
      <router-outlet />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      }
      .auth-shell {
        margin: 0 auto;
        max-width: 480px;
        padding: 4rem 1.5rem;
        color: #e2e8f0;
      }
      .auth-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      .auth-header h2 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
      }
      .auth-header p {
        margin: 0.75rem 0 0;
        color: rgba(226, 232, 240, 0.8);
      }
    `
  ]
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    console.info('AuthLayoutComponent inicializado');
  }

  ngOnDestroy(): void {
    console.info('AuthLayoutComponent destruído');
  }
}

