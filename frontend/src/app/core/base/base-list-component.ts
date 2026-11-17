import { Dialog } from '@angular/cdk/dialog';
import { DestroyRef, Directive, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export abstract class BaseListComponent<T extends BaseModel, F extends BaseFilter = BaseFilter>
  extends BaseComponent
  implements OnInit
{
  protected abstract readonly service: BaseService<T, F>;
  protected readonly dialog = inject(Dialog);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly objects = signal<T[]>([]);
  readonly noResults = signal(false);
  /** Total number of items across all pages (DRF `count`). */
  readonly count = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(new BaseFilter().page_size);

  ngOnInit(): void {
    this.getList();
  }

  getList(): void {
    this.loading.set(true);
    const filters = {
      page: this.page(),
      page_size: this.pageSize(),
      ...this.listFilters(),
    } as Partial<F>;
    this.service
      .getList(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.objects.set(res.results);
          this.count.set(res.count);
          this.noResults.set(res.results.length === 0);
          this.loading.set(false);
        },
        error: () => {
          this.objects.set([]);
          this.count.set(0);
          this.noResults.set(true);
          this.loading.set(false);
          this.toast.error(this.transloco.translate('common.loadError'));
        },
      });
  }

  /** Jumps to a page (1-based) and reloads; e.g. from a mat-paginator `(page)` event. */
  setPage(page: number, pageSize = this.pageSize()): void {
    this.page.set(page);
    this.pageSize.set(pageSize);
    this.getList();
  }

  /** Override to pass extra query params (filters, drf-flex-fields `expand`, …) on every fetch. */
  protected listFilters(): Partial<F> {
    return {};
  }
}
