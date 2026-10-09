import { Injectable } from '@angular/core';
import { TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';

import en from './en.json';
import pt from './pt.json';

const TRANSLATIONS: Record<string, Record<string, unknown>> = { en, pt };

/**
 * Translations are bundled JSON (shared/translate/{en,pt}.json), not
 * fetched over HTTP — so there's no asset path to wire up and no network
 * round-trip before the first render.
 */
@Injectable({ providedIn: 'root' })
export class TranslateJsonLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    return of(TRANSLATIONS[lang] ?? {});
  }
}
