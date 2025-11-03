import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout.component').then((m) => m.PublicLayoutComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
