import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * App Component - Componente raiz da aplicação
 * 
 * Configurado conforme E1-A1-1 e ADR-001:
 * - Componente standalone
 * - Router outlet para navegação
 */
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  styleUrls: ['./app.css'],
  templateUrl: './app.html'
})
export class App {
  constructor(translate: TranslateService) {
    // 1. Define pt-BR como fallback para chaves não encontradas
    translate.setFallbackLang('pt-BR');

    // 2. Detecta a língua do navegador
    const browserLang = translate.getBrowserLang();

    // 3. Define a língua a ser usada
    // Se for 'pt' ou 'pt-BR', usa 'pt-BR'
    // Caso contrário (ex: 'en', 'es'), você pode definir outra ou manter o fallback
    const languageToUse = browserLang?.match(/pt/) ? 'pt-BR' : 'en';

    translate.use(languageToUse);
  }
}
