import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { BaseComponent } from '../../base/base-component';
import { setStoredLang } from '../../../shared/translate/lang-storage';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell extends BaseComponent {
  private readonly transloco = inject(TranslocoService);

  // Add your own nav entries here, e.g.:
  // { path: '/widgets', labelKey: 'nav.widgets', icon: 'fa-solid fa-cube' },
  protected readonly navItems: { path: string; labelKey: string; icon: string }[] = [];

  protected readonly langs = ['en', 'pt'];
  protected readonly activeLang = signal(this.transloco.getActiveLang());

  setLang(lang: string): void {
    this.transloco.setActiveLang(lang);
    this.activeLang.set(lang);
    setStoredLang(lang);
  }
}
