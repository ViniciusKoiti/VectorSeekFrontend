import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GenerationProgressComponent } from './generation-progress.component';
import { GenerationService } from '@vectorseek/data-access';
import { TaskProgressService } from '@vectorseek/state';

describe('GenerationProgressComponent', () => {
  let component: GenerationProgressComponent;
  let fixture: ComponentFixture<GenerationProgressComponent>;
  let generationService: jasmine.SpyObj<GenerationService>;
  let progressService: jasmine.SpyObj<TaskProgressService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    generationService = jasmine.createSpyObj<GenerationService>('GenerationService', ['cancelGeneration']);
    generationService.cancelGeneration.and.returnValue(of({ success: true, message: 'Cancelado' }));

    progressService = jasmine.createSpyObj<TaskProgressService>('TaskProgressService', [
      'monitorProgress',
      'stopMonitoring'
    ]);
    progressService.monitorProgress.and.returnValue(EMPTY);

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);

    await TestBed.configureTestingModule({
      imports: [GenerationProgressComponent],
      providers: [
        { provide: GenerationService, useValue: generationService },
        { provide: TaskProgressService, useValue: progressService },
        { provide: MatDialog, useValue: dialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GenerationProgressComponent);
    component = fixture.componentInstance;
    component.taskId = 'task-1';
    fixture.detectChanges();
  });

  it('should request cancellation when dialog confirms', () => {
    const cancelledSpy = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(cancelledSpy);

    component.onCancelClick();

    expect(dialog.open).toHaveBeenCalled();
    expect(generationService.cancelGeneration).toHaveBeenCalledWith('task-1');
    expect(progressService.stopMonitoring).toHaveBeenCalled();
    expect(component.isCancelled()).toBeTrue();
    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should not call cancel service when dialog is dismissed', () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);

    component.onCancelClick();

    expect(generationService.cancelGeneration).not.toHaveBeenCalled();
  });
});
