import { Component, OnDestroy, OnInit } from '@angular/core';
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
  ngOnInit(): void {
    console.info('AuthLayoutComponent inicializado');
  }

  ngOnDestroy(): void {
    console.info('AuthLayoutComponent destruído');
  }
}

