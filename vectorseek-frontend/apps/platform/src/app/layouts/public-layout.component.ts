import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'vectorseek-public-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <main class="public-shell">
      <header class="public-header">
        <h1>VectorSeek Platform</h1>
        <p>Aplicação Angular com navegação lazy e páginas públicas.</p>
      </header>

      <nav class="public-nav">
        <a routerLink="/auth/login">Login</a>
        <a routerLink="/auth/register">Registrar</a>
      </nav>

      <section class="public-content">
        <p>Bem-vindo! Escolha uma opção acima para navegar.</p>
      </section>

      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; background: #f1f5f9; }
      .public-shell {
        margin: 0 auto;
        max-width: 720px;
        padding: 4rem 1.5rem;
        display: grid;
        gap: 2rem;
      }
      .public-header h1 { margin: 0; font-size: 2.5rem; color: #0f172a; }
      .public-header p { margin: 0.75rem 0 0; color: #475569; }
      .public-nav {
        display: flex;
        gap: 1.5rem;
      }
      .public-nav a {
        font-weight: 600;
        color: #2563eb;
        text-decoration: none;
      }
      .public-nav a:hover {
        text-decoration: underline;
      }
      .public-content { color: #1e293b; }
    `
  ]
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    console.info('PublicLayoutComponent inicializado');
  }

  ngOnDestroy(): void {
    console.info('PublicLayoutComponent destruído');
  }
}
