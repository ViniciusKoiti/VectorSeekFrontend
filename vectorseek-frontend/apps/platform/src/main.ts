import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslate } from '@ngx-translate/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding()
    ),
    provideTranslate({ defaultLanguage: 'pt-BR' })
  ]
}).then(() => {
  console.log('Platform application bootstrapped.');
}).catch((error) => {
  console.error('Failed to bootstrap application', error);
});
