import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { BaseComponent } from '../../../../core/base/base-component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login extends BaseComponent {
  private readonly fb = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth.login(identifier, password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success(this.transloco.translate('auth.login.success'));
        this.goTo('/');
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error(this.transloco.translate('auth.login.error'));
      },
    });
  }
}
