import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [TranslocoPipe],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
