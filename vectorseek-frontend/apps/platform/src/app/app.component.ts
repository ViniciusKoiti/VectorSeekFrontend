import { Component, computed, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { createForm, z } from '@colsen1996/ng-zod-form';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

@Component({
  selector: 'vectorseek-root',
  template: `
    <main class="app-shell">
      <h1>{{ title() }}</h1>
      <p>{{ description() }}</p>
      <section class="form-preview">
        <p i18n="@@formStatus">Form schema fields: {{ fieldCount() }}</p>
      </section>
    </main>
  `,
  styles: [
    `
    :host { display: block; font-family: sans-serif; padding: 2rem; }
    .app-shell { max-width: 640px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { margin: 0.5rem 0; }
    `
  ]
})
export class AppComponent {
  private readonly translate = new TranslateService();
  private readonly form = createForm(loginSchema);

  private readonly language = signal('en');

  title = computed(() => this.translate.instant('platform.title'));
  description = computed(() => this.translate.instant('platform.description'));
  fieldCount = computed(() => Object.keys(this.form.schema.shape || {}).length);

  constructor() {
    this.translate.setTranslation('en', {
      'platform.title': 'VectorSeek Platform',
      'platform.description': 'Angular SSR workspace with internationalisation and Zod forms.'
    });
    this.translate.use(this.language.value);
  }
}
