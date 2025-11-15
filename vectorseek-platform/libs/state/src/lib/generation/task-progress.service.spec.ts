import { TestBed } from '@angular/core/testing';
import { of, throwError, delay } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { TaskProgressService } from './task-progress.service';
import { GenerationService, GetProgressResponse } from '@vectorseek/data-access';

describe('TaskProgressService', () => {
  let service: TaskProgressService;
  let generationService: jasmine.SpyObj<GenerationService>;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    const generationServiceSpy = jasmine.createSpyObj('GenerationService', ['getProgress']);

    TestBed.configureTestingModule({
      providers: [
        TaskProgressService,
        { provide: GenerationService, useValue: generationServiceSpy }
      ]
    });

    service = TestBed.inject(TaskProgressService);
    generationService = TestBed.inject(GenerationService) as jasmine.SpyObj<GenerationService>;

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should poll progress until completed', (done) => {
    const taskId = 'task-123';
    const responses: GetProgressResponse[] = [
      {
        taskId,
        status: 'processing',
        stage: 'context',
        percentage: 30,
        message: 'Processing...'
      },
      {
        taskId,
        status: 'processing',
        stage: 'rendering',
        percentage: 70,
        message: 'Rendering...'
      },
      {
        taskId,
        status: 'completed',
        stage: 'completed',
        percentage: 100,
        message: 'Done',
        result: {
          id: 'doc-1',
          title: 'Test Doc',
          content: 'Content',
          format: 'markdown',
          templateUsed: 'template-1',
          metadata: {
            generatedAt: new Date().toISOString()
          }
        }
      }
    ];

    let callCount = 0;
    generationService.getProgress.and.callFake(() => {
      const response = responses[callCount++];
      return of<GetProgressResponse>(response).pipe(delay(100));
    });

    const results: GetProgressResponse[] = [];
    service.monitorProgress(taskId, 100).subscribe({
      next: (progress) => {
        results.push(progress);
        if (progress.status === 'completed') {
          expect(results.length).toBe(3);
          expect(results[2].status).toBe('completed');
          done();
        }
      },
      error: (err) => done.fail(err)
    });
  });

  it('should handle 404 errors (expired task)', (done) => {
    const taskId = 'task-expired';
    const error404 = {
      status: 404,
      code: 'task_not_found',
      summary: 'Task not found',
      description: 'Task expired'
    };

    generationService.getProgress.and.returnValue(throwError(() => error404));

    service.monitorProgress(taskId).subscribe({
      next: () => done.fail('Should not emit'),
      error: (err) => {
        expect(err.status).toBe(404);
        expect(err.summary).toContain('expirada');
        done();
      }
    });
  });

  it('should allow manual cancellation', (done) => {
    const taskId = 'task-123';
    generationService.getProgress.and.returnValue(
      of<GetProgressResponse>({
        taskId,
        status: 'processing',
        stage: 'context',
        percentage: 50,
        message: 'Processing...'
      }).pipe(delay(100))
    );

    let emissionCount = 0;
    service.monitorProgress(taskId, 100).subscribe({
      next: () => {
        emissionCount++;
        if (emissionCount === 2) {
          service.stopMonitoring();
          // Wait a bit to ensure no more emissions
          setTimeout(() => {
            expect(emissionCount).toBe(2);
            done();
          }, 500);
        }
      },
      error: (err) => done.fail(err)
    });
  });
});
