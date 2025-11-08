import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe para destacar termos em texto
 * Conforme especificação E2-A2
 *
 * Uso: {{ text | highlightTerms:searchTerms }}
 */
@Pipe({
  name: 'highlightTerms',
  standalone: true
})
export class HighlightTermsPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string, terms?: string | string[]): SafeHtml {
    if (!text) {
      return '';
    }

    if (!terms || (Array.isArray(terms) && terms.length === 0)) {
      return text;
    }

    // Converter para array se for string
    const searchTerms = Array.isArray(terms) ? terms : [terms];

    // Filtrar termos vazios e escapar caracteres especiais de regex
    const validTerms = searchTerms
      .filter((term) => term && term.trim().length > 0)
      .map((term) => this.escapeRegex(term.trim()));

    if (validTerms.length === 0) {
      return text;
    }

    // Criar regex que captura todos os termos (case insensitive)
    const regex = new RegExp(`(${validTerms.join('|')})`, 'gi');

    // Substituir termos por versão destacada
    const highlightedText = text.replace(regex, '<mark class="highlight">$1</mark>');

    // Sanitizar para prevenir XSS
    return this.sanitizer.sanitize(1, highlightedText) || text;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
