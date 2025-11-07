import { Routes } from '@angular/router';

/**
 * Rotas do módulo de Geração de Conteúdo
 *
 * Configurado conforme E3-A1, E3-A3 e E3-A4:
 * - Lazy loading dos componentes standalone
 * - Rotas: /app/generation, /app/generation/history, /app/generation/export
 */
export const generationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./generation-wizard.component').then((m) => m.GenerationWizardComponent)
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./generation-history.component').then((m) => m.GenerationHistoryComponent)
  },
  {
    path: 'export',
    loadComponent: () =>
      import('./export/export-form.component').then((m) => m.ExportFormComponent)
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./generation-wizard.component').then((m) => m.GenerationWizardComponent)
  }
];
