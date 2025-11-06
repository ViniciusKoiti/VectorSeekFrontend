import { Routes } from '@angular/router';

/**
 * Rotas do módulo Q&A (Perguntas e Respostas)
 *
 * Configurado conforme E2-A1:
 * - Lazy loading dos componentes standalone
 * - Rota principal /app/qna
 */
export const qnaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./qna-page.component').then((m) => m.QnaPageComponent)
  }
];
