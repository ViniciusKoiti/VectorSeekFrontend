import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

/**
 * Layout principal da aplicação
 *
 * Componente que envolve todos os módulos com:
 * - Navbar de navegação
 * - Router outlet para conteúdo
 *
 * Padrão: Layout modular que pode ser estendido
 */
@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.css'],
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
})
export class AppLayoutComponent {}
