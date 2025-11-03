import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslate } from '@ngx-translate/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideTranslate({ defaultLanguage: 'en' })
  ]
}).then(() => {
  console.log('Platform application bootstrapped.');
}).catch((error) => {
  console.error('Failed to bootstrap application', error);
});
