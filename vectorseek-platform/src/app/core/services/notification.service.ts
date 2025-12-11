import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private snackBar = inject(MatSnackBar);

    success(message: string): void {
        this.snackBar.open(message, 'Fechar', {
            duration: 3000,
            panelClass: ['snackbar-success']
        });
    }

    error(message: string): void {
        this.snackBar.open(message, 'Fechar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    warning(message: string): void {
        this.snackBar.open(message, 'Fechar', {
            duration: 4000,
            panelClass: ['snackbar-warning']
        });
    }

    info(message: string): void {
        this.snackBar.open(message, 'Fechar', {
            duration: 3000,
            panelClass: ['snackbar-info']
        });
    }
}
