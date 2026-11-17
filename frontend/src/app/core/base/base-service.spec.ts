import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BaseModel } from './base-model';
import { BaseService } from './base-service';

class Widget extends BaseModel {
  name?: string;
}

@Injectable({ providedIn: 'root' })
class WidgetService extends BaseService<Widget> {
  constructor() {
    super('widgets/');
  }
}

describe('BaseService', () => {
  let service: WidgetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WidgetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends page/page_size and skips empty filters', () => {
    service.getList({ page: 2, page_size: 50, expand: undefined }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/widgets/');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('50');
    expect(req.request.params.has('expand')).toBe(false);
    req.flush({ count: 0, next: null, previous: null, results: [] });
  });

  it('updates and deletes by id, without read-only or view-only fields', () => {
    const widget: Widget = { id: 7, name: 'gear', created_at: 'x', updated_at: 'y', loading: true };

    service.update(widget).subscribe();
    const patch = httpMock.expectOne('/api/widgets/7/');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ name: 'gear' });
    patch.flush(widget);

    service.delete(widget).subscribe();
    const del = httpMock.expectOne('/api/widgets/7/');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });

  it('refuses to update an unsaved item', () => {
    expect(() => service.update({ name: 'new' })).toThrow(/no id/);
  });
});
