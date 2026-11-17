import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';

import { App } from './app';
import { TranslateJsonLoader } from './shared/translate/translate.loader';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTransloco({
          config: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
          loader: TranslateJsonLoader,
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('keeps <html lang> in sync with the active language', () => {
    TestBed.createComponent(App);
    TestBed.inject(TranslocoService).setActiveLang('pt');
    expect(document.documentElement.lang).toBe('pt-BR');
  });
});
