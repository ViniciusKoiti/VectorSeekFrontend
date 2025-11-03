import { bootstrapApplication } from '@angular/platform-server';
import { provideRouter } from '@angular/router';
import { provideTranslate } from '@ngx-translate/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

export function render(): Promise<string> {
  return bootstrapApplication(AppComponent, {
    providers: [
      provideRouter(appRoutes),
      provideTranslate({ defaultLanguage: 'en' })
    ]
  }).then(appRef => appRef.render());
}
