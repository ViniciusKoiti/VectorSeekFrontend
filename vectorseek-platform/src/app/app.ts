import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * App Component - Componente raiz da aplicação
 * 
 * Configurado conforme E1-A1-1 e ADR-001:
 * - Componente standalone
 * - Router outlet para navegação
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  styleUrls: ['./app.css'],
  templateUrl: './app.html'
})
export class App {}
