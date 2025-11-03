import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      },
      {
        path: 'login',
        loadComponent: () => import('./login-page.component').then((m) => m.LoginPageComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./register-page.component').then((m) => m.RegisterPageComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password.component').then((m) => m.ForgotPasswordComponent)
      }
    ]
  }
];
