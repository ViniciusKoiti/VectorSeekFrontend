import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'vectorseek-forgot-password-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="auth-page">
      <h3 i18n="@@forgotPasswordTitle">Reset your password</h3>
      <p i18n="@@forgotPasswordDescription">Password recovery flow placeholder.</p>
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
export class ForgotPasswordComponent implements OnInit {
  ngOnInit(): void {
    console.info('Forgot password page ready for user interaction.');
  }
}
