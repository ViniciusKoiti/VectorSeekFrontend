import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { WorkspacesService } from '@vectorseek/data-access';
import { Workspace } from '@vectorseek/data-access/lib/workspaces/workspaces.models';
import { WorkspaceFormDialogComponent, WorkspaceFormDialogResult } from './workspace-form-dialog.component';
import { WorkspaceDeleteDialogComponent } from './workspace-delete-dialog.component';

@Component({
  selector: 'app-workspaces-page',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './workspaces-page.component.html',
  styleUrls: ['./workspaces-page.component.css']
})
export class WorkspacesPageComponent implements OnInit {
  private readonly workspacesService = inject(WorkspacesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  workspaces = signal<Workspace[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.loading.set(true);
    this.error.set(null);

    this.workspacesService.listWorkspaces().subscribe({
      next: (items) => {
        this.workspaces.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.description ?? err.summary ?? 'Não foi possível carregar os workspaces.');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.dialog
      .open(WorkspaceFormDialogComponent, {
        width: '480px',
        data: { mode: 'create' } as const
      })
      .afterClosed()
      .subscribe((result: WorkspaceFormDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.createWorkspace(result);
      });
  }

  openEditDialog(workspace: Workspace): void {
    this.dialog
      .open(WorkspaceFormDialogComponent, {
        width: '480px',
        data: { mode: 'edit', workspace }
      })
      .afterClosed()
      .subscribe((result: WorkspaceFormDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.updateWorkspace(workspace.id, result);
      });
  }

  confirmDelete(workspace: Workspace): void {
    this.dialog
      .open(WorkspaceDeleteDialogComponent, {
        width: '420px',
        data: { name: workspace.name }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.deleteWorkspace(workspace.id);
        }
      });
  }

  formatDate(value?: Date): string {
    if (!value) {
      return '-';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(value);
  }

  trackByWorkspace(_: number, workspace: Workspace): string {
    return workspace.id;
  }

  private createWorkspace(payload: WorkspaceFormDialogResult): void {
    this.workspacesService.createWorkspace(payload).subscribe({
      next: (workspace) => {
        this.workspaces.update((current) => [workspace, ...current]);
        this.showSuccess('Workspace criado com sucesso.');
      },
      error: (err) => {
        this.showError(err.description ?? err.summary);
      }
    });
  }

  private updateWorkspace(id: string, payload: WorkspaceFormDialogResult): void {
    this.workspacesService.updateWorkspace(id, payload).subscribe({
      next: (workspace) => {
        this.workspaces.update((current) => current.map((item) => (item.id === workspace.id ? workspace : item)));
        this.showSuccess('Workspace atualizado com sucesso.');
      },
      error: (err) => this.showError(err.description ?? err.summary)
    });
  }

  private deleteWorkspace(id: string): void {
    this.workspacesService.deleteWorkspace(id).subscribe({
      next: () => {
        this.workspaces.update((current) => current.filter((item) => item.id !== id));
        this.showSuccess('Workspace deletado com sucesso.');
      },
      error: (err) => this.showError(err.description ?? err.summary)
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message ?? 'Erro inesperado.', 'Fechar', {
      duration: 4000
    });
  }
}
