import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent
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
