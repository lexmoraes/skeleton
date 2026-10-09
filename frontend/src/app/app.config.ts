import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { authInterceptor } from './core/auth/auth.interceptor';
import { LocaleDateAdapter } from './shared/components/date-field/locale-date-adapter';
import { getStoredLang } from './shared/translate/lang-storage';
import { TranslateJsonLoader } from './shared/translate/translate.loader';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: DateAdapter, useClass: LocaleDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    provideTransloco({
      config: {
        availableLangs: ['en', 'pt'],
        defaultLang: getStoredLang('en'),
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslateJsonLoader,
    }),
  ],
};
