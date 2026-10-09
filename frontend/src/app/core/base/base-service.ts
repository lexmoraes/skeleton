import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseFilter } from './base-filter';
import { BaseModel } from './base-model';
import { BasePaginatedResponse } from './base-paginated-response';

/**
 * Generic REST client every feature service extends: point it at a
 * resource path and get list/detail/create/update/delete for free.
 */
export abstract class BaseService<T extends BaseModel, F extends BaseFilter = BaseFilter> {
  protected readonly http = inject(HttpClient);
  protected resourceUrl: string;

  protected constructor(resourcePath: string) {
    this.resourceUrl = `${environment.API.BASE_URL}${resourcePath}`;
  }

  private toParams(filters?: Partial<F>): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  getList(filters?: Partial<F>): Observable<BasePaginatedResponse<T>> {
    return this.http.get<BasePaginatedResponse<T>>(this.resourceUrl, { params: this.toParams(filters) });
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.resourceUrl}${id}/`);
  }

  getByUrl(url: string): Observable<T> {
    return this.http.get<T>(url);
  }

  create(payload: Partial<T> | FormData): Observable<T> {
    return this.http.post<T>(this.resourceUrl, payload);
  }

  update(item: T): Observable<T> {
    return this.http.patch<T>(item.url!, item);
  }

  updateById(id: number, payload: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.resourceUrl}${id}/`, payload);
  }

  delete(item: T): Observable<void> {
    return this.http.delete<void>(item.url!);
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}${id}/`);
  }
}
