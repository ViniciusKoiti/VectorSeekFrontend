import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteConfirmationModalComponent, ConfirmationDialogData } from './delete-confirmation-modal.component';

describe('DeleteConfirmationModalComponent', () => {
  let component: DeleteConfirmationModalComponent;
  let fixture: ComponentFixture<DeleteConfirmationModalComponent>;
  let dialogRefCloseSpy: jasmine.Spy;

  beforeEach(async () => {
    dialogRefCloseSpy = jasmine.createSpy('close');

    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: dialogRefCloseSpy } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Confirmar ação',
            message: 'Mensagem de teste'
          } satisfies ConfirmationDialogData
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit confirmation when confirm button is clicked', () => {
    component.onConfirm();
    expect(dialogRefCloseSpy).toHaveBeenCalledWith(true);
  });

  it('should emit cancellation when cancel button is clicked', () => {
    component.onCancel();
    expect(dialogRefCloseSpy).toHaveBeenCalledWith(false);
  });
});
