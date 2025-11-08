import { Injectable, inject } from '@angular/core';
import {
  Observable,
  Subject,
  timer,
  switchMap,
  takeUntil,
  retry,
  catchError,
  throwError,
  tap,
  EMPTY,
  scan
} from 'rxjs';
import { GenerationService, GetProgressResponse, GenerationError } from '@vectorseek/data-access';

/**
 * Serviço para monitorar progresso de tarefas de geração com polling exponencial
 * Conforme especificação E3-A2
 *
 * Implementa:
 * - Polling exponencial com RxJS timer e switchMap
 * - Tratamento de erros 503 (retry automático)
 * - Tratamento de erros 404 (expiração de tarefa)
 * - Cancelamento manual via Subject
 */
@Injectable({ providedIn: 'root' })
export class TaskProgressService {
  private readonly generationService = inject(GenerationService);
  private readonly cancelSubject = new Subject<void>();

  /**
   * Monitora o progresso de uma tarefa com polling exponencial
   *
   * @param taskId - ID da tarefa a ser monitorada
   * @param initialDelay - Delay inicial em ms (padrão: 1000ms)
   * @param maxDelay - Delay máximo em ms (padrão: 10000ms)
   * @param maxRetries - Número máximo de retries para erros 503 (padrão: 3)
   * @returns Observable que emite atualizações de progresso até conclusão ou erro
   */
  monitorProgress(
    taskId: string,
    initialDelay: number = 1000,
    maxDelay: number = 10000,
    maxRetries: number = 3
  ): Observable<GetProgressResponse> {
    let currentDelay = initialDelay;

    return timer(0, currentDelay).pipe(
      // Usa scan para implementar backoff exponencial
      scan((acc) => {
        const nextDelay = Math.min(acc.delay * 1.5, maxDelay);
        return { delay: nextDelay, count: acc.count + 1 };
      }, { delay: currentDelay, count: 0 }),

      // Para cada tick, consulta o progresso
      switchMap(() =>
        this.generationService.getProgress(taskId).pipe(
          // Retry automático para erros 503 (Service Unavailable)
          retry({
            count: maxRetries,
            delay: (error: GenerationError) => {
              if (error.status === 503) {
                return timer(error.retryAfterSeconds ? error.retryAfterSeconds * 1000 : 2000);
              }
              return throwError(() => error);
            }
          }),

          // Tratamento de erros
          catchError((error: GenerationError) => {
            // Erro 404 indica que a tarefa expirou
            if (error.status === 404) {
              return throwError(() => ({
                ...error,
                summary: 'Tarefa expirada',
                description: 'A tarefa de geração não foi encontrada ou expirou. Inicie uma nova geração.'
              }));
            }
            return throwError(() => error);
          })
        )
      ),

      // Para o polling quando a tarefa estiver completa ou falhar
      takeUntil(this.cancelSubject),

      // Para automaticamente quando status for 'completed' ou 'failed'
      tap((progress) => {
        if (progress.status === 'completed' || progress.status === 'failed') {
          this.stopMonitoring();
        }
      })
    );
  }

  /**
   * Cancela o polling manualmente
   */
  stopMonitoring(): void {
    this.cancelSubject.next();
  }

  /**
   * Limpa recursos ao destruir o serviço
   */
  ngOnDestroy(): void {
    this.cancelSubject.complete();
  }
}
