import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { createForm, z } from '@colsen1996/ng-zod-form';
import { TranslateService } from '@ngx-translate/core';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

@Component({
  selector: 'vectorseek-public-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <main class="app-shell">
      <header class="app-header">
        <h1>{{ title() }}</h1>
        <nav class="app-nav">
          <a routerLink="/auth/login" i18n="@@navLogin">Login</a>
          <a routerLink="/auth/register" i18n="@@navRegister">Register</a>
        </nav>
      </header>
      <p>{{ description() }}</p>
      <section class="form-preview">
        <p i18n="@@formStatus">Form schema fields: {{ fieldCount() }}</p>
      </section>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host { display: block; font-family: sans-serif; padding: 2rem; }
      .app-shell { max-width: 640px; margin: 0 auto; }
      .app-header { display: flex; justify-content: space-between; align-items: center; }
      .app-nav { display: flex; gap: 1rem; }
      .app-nav a { color: #0070f3; text-decoration: none; font-weight: 600; }
      .app-nav a:hover { text-decoration: underline; }
      h1 { font-size: 2rem; margin-bottom: 0.5rem; }
      p { margin: 0.5rem 0; }
    `
  ]
})
export class PublicLayoutComponent implements OnInit {
  private readonly translate = new TranslateService();
  private readonly form = createForm(loginSchema);

  private readonly language = signal('en');

  readonly title = computed(() => this.translate.instant('platform.title'));
  readonly description = computed(() => this.translate.instant('platform.description'));
  readonly fieldCount = computed(() => Object.keys(this.form.schema.shape || {}).length);

  ngOnInit(): void {
    this.translate.setTranslation('en', {
      'platform.title': 'VectorSeek Platform',
      'platform.description': 'Angular SSR workspace with internationalisation and Zod forms.'
    });
    this.translate.use(this.language());
  }
}
