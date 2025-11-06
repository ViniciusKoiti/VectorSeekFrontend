import { Routes } from '@angular/router';

/**
 * Rotas principais da aplicação
 *
 * Configurado conforme E1-A1-1 e ADR-001:
 * - Lazy loading do módulo de autenticação usando loadChildren
 * - Rotas públicas separadas da área privada
 * - E2-A1: módulo Q&A
 */
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: 'app',
    children: [
      {
        path: 'qna',
        loadChildren: () => import('./qna/qna.routes').then((m) => m.qnaRoutes)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];
