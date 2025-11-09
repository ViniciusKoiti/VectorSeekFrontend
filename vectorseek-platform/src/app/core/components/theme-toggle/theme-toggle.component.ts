import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    const newTheme = this.themeService.getTheme() === 'dark' ? 'light' : 'dark';
    this.themeService.setTheme(newTheme);
  }
}
