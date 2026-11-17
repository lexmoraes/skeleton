import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseFilter } from './base-filter';
import { BaseModel, NON_PAYLOAD_FIELDS } from './base-model';
import { BasePaginatedResponse } from './base-paginated-response';

/**
 * Generic REST client every feature service extends: point it at a
 * resource path (e.g. 'widgets/', with trailing slash) and get
 * list/detail/create/update/delete for free.
 */
export abstract class BaseService<T extends BaseModel, F extends BaseFilter = BaseFilter> {
  protected readonly http = inject(HttpClient);
  protected resourceUrl: string;

  protected constructor(resourcePath: string) {
    this.resourceUrl = `${environment.API.BASE_URL}${resourcePath}`;
  }

  protected detailUrl(id: number): string {
    return `${this.resourceUrl}${id}/`;
  }

  /** Drops client-only and server-managed fields before sending a model. */
  protected toPayload(item: Partial<T>): Partial<T> {
    const payload = { ...item } as Record<string, unknown>;
    for (const field of NON_PAYLOAD_FIELDS) {
      delete payload[field];
    }
    return payload as Partial<T>;
  }

  private toParams(filters?: Partial<F>): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  getList(filters?: Partial<F>): Observable<BasePaginatedResponse<T>> {
    return this.http.get<BasePaginatedResponse<T>>(this.resourceUrl, {
      params: this.toParams(filters),
    });
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(this.detailUrl(id));
  }

  /** Follows an absolute URL from the API, e.g. a paginated `next`/`previous` link. */
  getByUrl(url: string): Observable<T> {
    return this.http.get<T>(url);
  }

  create(payload: Partial<T> | FormData): Observable<T> {
    return this.http.post<T>(
      this.resourceUrl,
      payload instanceof FormData ? payload : this.toPayload(payload),
    );
  }

  /** PATCHes `item` (its `id` picks the resource; read-only fields are not sent). */
  update(item: T): Observable<T> {
    return this.updateById(this.requireId(item), item);
  }

  updateById(id: number, payload: Partial<T> | FormData): Observable<T> {
    return this.http.patch<T>(
      this.detailUrl(id),
      payload instanceof FormData ? payload : this.toPayload(payload),
    );
  }

  delete(item: T): Observable<void> {
    return this.deleteById(this.requireId(item));
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(this.detailUrl(id));
  }

  private requireId(item: T): number {
    if (item.id == null) {
      throw new Error('BaseService: item has no id (not saved yet?)');
    }
    return item.id;
  }
}
