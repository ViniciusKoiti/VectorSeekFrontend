import { Routes } from '@angular/router';

/**
 * Rotas do módulo de Geração de Conteúdo
 *
 * Configurado conforme E3-A1:
 * - Lazy loading dos componentes standalone
 * - Rota principal /app/generation
 * - E8-T7: Histórico de gerações em /app/generation/history
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
      import('./history/generation-history-page.component').then((m) => m.GenerationHistoryPageComponent)
  }
];
