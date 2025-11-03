import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'vectorseek-forgot-password-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-page">
      <header>
        <h1>Recuperar acesso</h1>
        <p>Informe seu e-mail para receber instruções de recuperação.</p>
      </header>

      <section class="auth-content">
        <p>Este placeholder representa o fluxo de recuperação de senha.</p>
      </section>

      <footer class="auth-footer">
        <a routerLink="/auth/login">Voltar ao login</a>
      </footer>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .auth-page {
        display: grid;
        gap: 1.5rem;
        padding: 2rem;
        border-radius: 1rem;
        background: #ffffff;
        box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
      }
      header h1 { margin: 0; font-size: 1.875rem; }
      header p { margin: 0.5rem 0 0; color: #475569; }
      .auth-content { color: #0f172a; }
      .auth-footer {
        display: flex;
        justify-content: flex-start;
      }
      .auth-footer a {
        font-weight: 600;
        color: #2563eb;
        text-decoration: none;
      }
      .auth-footer a:hover {
        text-decoration: underline;
      }
    `
  ]
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    console.info('ForgotPasswordComponent inicializado');
  }

  ngOnDestroy(): void {
    console.info('ForgotPasswordComponent destruído');
  }
}
