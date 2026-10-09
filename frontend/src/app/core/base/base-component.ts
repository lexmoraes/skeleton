import { Location } from '@angular/common';
import { Directive, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

/**
 * Common ground for page/feature components: navigation shortcuts, a
 * shared loading flag, and toast helpers. Extend this directly from any
 * page/feature component.
 */
@Directive()
export abstract class BaseComponent {
  protected readonly router = inject(Router);
  protected readonly location = inject(Location);
  protected readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly currentUser = this.auth.currentUser;

  goTo(commands: string | any[], extras?: Record<string, unknown>): void {
    const path = Array.isArray(commands) ? commands : [commands];
    this.router.navigate(path, extras);
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.auth.logout();
    this.goTo('/login');
  }

  protected async withLoading<T>(action: () => Promise<T>): Promise<T> {
    this.loading.set(true);
    try {
      return await action();
    } finally {
      this.loading.set(false);
    }
  }
}
