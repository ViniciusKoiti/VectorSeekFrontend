import { Routes } from '@angular/router';

/**
 * Rotas do módulo de Documentos
 * Conforme especificação E2-A3
 */
export const documentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./documents-page.component').then((m) => m.DocumentsPageComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/document-detail/document-detail.component').then(
        (m) => m.DocumentDetailComponent
      )
  }
];
