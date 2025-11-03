import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'vectorseek-login-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="auth-page">
      <h3 i18n="@@loginTitle">Welcome back</h3>
      <p i18n="@@loginDescription">This is a placeholder for the login experience.</p>
    </article>
  `,
  styles: [
    `
      .auth-page { display: grid; gap: 1rem; text-align: center; }
      h3 { font-size: 1.5rem; }
      p { color: #4a5568; }
    `
  ]
})
export class LoginPageComponent implements OnInit {
  ngOnInit(): void {
    console.info('Login page ready for user interaction.');
  }
}
