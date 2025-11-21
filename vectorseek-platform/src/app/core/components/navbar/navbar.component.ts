import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

/**
 * Navbar Colapsável Minimalista
 * 
 * Comportamento:
 * - Inativo: Coluna estreita no canto esquerdo (60px)
 * - Ativo (hover): Expande para mostrar labels completos
 * - Mobile: Menu hamburguer tradicional
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
})
export class NavbarComponent {
  isExpanded = false;
  isMobileMenuOpen = false;

  // Expandir sidebar no hover (apenas desktop)
  onMouseEnter(): void {
    if (window.innerWidth > 768) {
      this.isExpanded = true;
    }
  }

  onMouseLeave(): void {
    if (window.innerWidth > 768) {
      this.isExpanded = false;
    }
  }

  // Toggle menu mobile
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // Navegação
  navItems = [
    {
      label: 'Q&A',
      path: '/app/qna',
      icon: 'chat',
      description: 'Perguntas e Respostas'
    },
    {
      label: 'Documentos',
      path: '/app/documents',
      icon: 'docs',
      description: 'Gerenciar Documentos'
    },
    {
      label: 'Workspaces',
      path: '/app/workspaces',
      icon: 'workspaces',
      description: 'Gerenciar workspaces'
    },
    {
      label: 'Geração',
      path: '/app/generation',
      icon: 'spark',
      description: 'Gerar Conteúdo'
    }
  ];

  // Ícones SVG simples
  getIcon(name: string): string {
    const icons: Record<string, string> = {
      chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>`,
      docs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>`,
      spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M12 3l2 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L3 10h7l2-7z"/>
             </svg>`,
      search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>`,
      menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>`,
      close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <line x1="18" y1="6" x2="6" y2="18"/>
               <line x1="6" y1="6" x2="18" y2="18"/>
             </svg>`,
      workspaces: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <rect x="3" y="3" width="7" height="7" rx="1"/>
               <rect x="14" y="3" width="7" height="7" rx="1"/>
               <rect x="3" y="14" width="7" height="7" rx="1"/>
               <rect x="14" y="14" width="7" height="7" rx="1"/>
             </svg>`
    };
    return icons[name] || '';
  }
}
