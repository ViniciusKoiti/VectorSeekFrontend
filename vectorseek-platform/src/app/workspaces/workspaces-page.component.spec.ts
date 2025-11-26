import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { WorkspacesService } from '@vectorseek/data-access';
import { Workspace } from '@vectorseek/data-access/lib/workspaces/workspaces.models';
import { WorkspacesPageComponent } from './workspaces-page.component';

describe('WorkspacesPageComponent', () => {
  let component: WorkspacesPageComponent;
  let fixture: ComponentFixture<WorkspacesPageComponent>;
  let workspacesService: jasmine.SpyObj<WorkspacesService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockWorkspace: Workspace = {
    id: 'ws-1',
    name: 'Workspace 1',
    createdAt: new Date('2024-01-01T10:00:00Z')
  };

  beforeEach(async () => {
    workspacesService = jasmine.createSpyObj<WorkspacesService>('WorkspacesService', [
      'listWorkspaces',
      'createWorkspace',
      'updateWorkspace',
      'deleteWorkspace'
    ]);
    workspacesService.listWorkspaces.and.returnValue(of([mockWorkspace]));
    workspacesService.createWorkspace.and.returnValue(
      of({ id: 'ws-2', name: 'Novo', createdAt: new Date() })
    );

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [WorkspacesPageComponent],
      providers: [
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspacesPageComponent);
    component = fixture.componentInstance;
    // Force component to use mocked dialog/snackbar
    (component as any).dialog = dialog;
    (component as any).snackBar = snackBar;
    fixture.detectChanges();
  });

  it('should load workspaces on init', () => {
    expect(workspacesService.listWorkspaces).toHaveBeenCalled();
    expect(component.workspaces().length).toBe(1);
  });

  it('should create workspace when dialog returns data', fakeAsync(() => {
    dialog.open.and.returnValue({ afterClosed: () => of({ name: 'Novo' }) } as any);

    component.openCreateDialog();
    flush();

    expect(workspacesService.createWorkspace).toHaveBeenCalledWith({ name: 'Novo' });
    expect(snackBar.open).toHaveBeenCalled();
  }));
});
