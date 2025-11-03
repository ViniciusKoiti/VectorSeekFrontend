import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../layouts/auth-layout.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
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
