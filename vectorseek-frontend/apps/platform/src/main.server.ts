import { bootstrapApplication } from '@angular/platform-server';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslate } from '@ngx-translate/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

export function render(): Promise<string> {
  return bootstrapApplication(AppComponent, {
    providers: [
      provideRouter(
        appRoutes,
        withComponentInputBinding()
      ),
      provideTranslate({ defaultLanguage: 'pt-BR' })
    ]
  }).then(appRef => appRef.render());
}
