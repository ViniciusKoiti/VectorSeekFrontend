import { Routes } from '@angular/router';
import { AppLayoutComponent } from './core/layouts/app-layout/app-layout.component';

/**
 * Rotas principais da aplicação
 *
 * Configurado conforme E1-A1-1 e ADR-001:
 * - Lazy loading do módulo de autenticação usando loadChildren
 * - Rotas públicas separadas da área privada
 * - E2-A1: módulo Q&A
 * - E2-A3: módulo de Documentos
 * - E3-A1: módulo de Geração de Conteúdo
 *
 * Layout modular:
 * - AppLayoutComponent envolve todas as rotas protegidas com Navbar
 */
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: 'app',
    component: AppLayoutComponent,
    children: [
      {
        path: 'qna',
        loadChildren: () => import('./qna/qna.routes').then((m) => m.qnaRoutes)
      },
      {
        path: 'documents',
        loadChildren: () => import('./qna/documents/documents.routes').then((m) => m.documentsRoutes)
      },
      {
        path: 'generation',
        loadChildren: () => import('./generation/generation.routes').then((m) => m.generationRoutes)
      },
      {
        path: 'workspaces',
        loadChildren: () => import('./workspaces/workspaces.routes').then((m) => m.workspacesRoutes)
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.routes').then((m) => m.settingsRoutes)
      },
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes)
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
