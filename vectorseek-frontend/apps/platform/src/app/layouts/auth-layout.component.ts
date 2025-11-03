import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'vectorseek-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <section class="auth-shell">
      <header>
        <h2 i18n="@@authLayoutTitle">Authentication</h2>
      </header>
      <router-outlet />
    </section>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; background: #f5f7fb; }
      .auth-shell {
        margin: 0 auto;
        max-width: 480px;
        padding: 4rem 2rem;
      }
      h2 { text-align: center; margin-bottom: 2rem; font-size: 1.75rem; }
    `
  ]
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    console.info('Auth layout initialised');
  }

  ngOnDestroy(): void {
    console.info('Auth layout destroyed');
  }
}
