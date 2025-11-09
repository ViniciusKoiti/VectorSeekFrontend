// auth-error.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'authError',
  standalone: true,
  pure: false
})
export class AuthErrorPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string, fallback?: string): string {
    if (!value) return fallback || '';
    
    if (value.startsWith('auth.apiErrors')) {
      const translated = this.translate.instant(value);
      
      if (translated === value) {
        return fallback || value;
      }
      
      return translated;
    }
    
    return value;
  }
}