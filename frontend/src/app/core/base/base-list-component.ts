import { Dialog } from '@angular/cdk/dialog';
import { Directive, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { BaseComponent } from './base-component';
import { BaseFilter } from './base-filter';
import { BaseModel } from './base-model';
import { BaseService } from './base-service';

/**
 * Common ground for CRUD list pages: fetch + render a paginated resource,
 * open the shared create/edit dialog (table + "same dialog for create and
 * edit"). Built on signals and CDK Dialog.
 */
@Directive()
export abstract class BaseListComponent<T extends BaseModel, F extends BaseFilter = BaseFilter> extends BaseComponent {
  protected abstract readonly service: BaseService<T, F>;
  protected readonly dialog = inject(Dialog);
  private readonly transloco = inject(TranslocoService);

  readonly objects = signal<T[]>([]);
  readonly noResults = signal(false);

  ngOnInit(): void {
    this.getList();
  }

  getList(): void {
    this.loading.set(true);
    this.service.getList(this.listFilters()).subscribe({
      next: (res) => {
        this.objects.set(res.results);
        this.noResults.set(res.results.length === 0);
        this.loading.set(false);
      },
      error: () => {
        this.noResults.set(true);
        this.loading.set(false);
        this.toast.error(this.transloco.translate('common.loadError'));
      },
    });
  }

  /** Override to pass extra query params (e.g. drf-flex-fields `expand`) on every fetch. */
  protected listFilters(): Partial<F> {
    return {};
  }
}
