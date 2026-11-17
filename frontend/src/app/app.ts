import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import { ToastContainer } from './shared/toast/toast-container';

/** BCP 47 tag for <html lang> (screen readers, hyphenation, spell-check). */
const HTML_LANG: Record<string, string> = { pt: 'pt-BR', en: 'en' };

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    const document = inject(DOCUMENT);
    inject(TranslocoService)
      .langChanges$.pipe(takeUntilDestroyed())
      .subscribe((lang) => (document.documentElement.lang = HTML_LANG[lang] ?? lang));
  }
}
