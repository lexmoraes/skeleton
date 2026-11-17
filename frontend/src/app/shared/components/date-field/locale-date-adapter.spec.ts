import { TestBed } from '@angular/core/testing';

import { LocaleDateAdapter } from './locale-date-adapter';

describe('LocaleDateAdapter.parse', () => {
  let adapter: LocaleDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LocaleDateAdapter] });
    adapter = TestBed.inject(LocaleDateAdapter);
  });

  const ymd = (d: Date | null) =>
    d && !isNaN(d.getTime()) ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : null;

  it('reads day-first for pt-BR, including days above 12', () => {
    adapter.setLocale('pt-BR');
    expect(ymd(adapter.parse('25/12/2024'))).toEqual([2024, 12, 25]);
    expect(ymd(adapter.parse('03-04-2024'))).toEqual([2024, 4, 3]);
  });

  it('reads month-first for en-US', () => {
    adapter.setLocale('en-US');
    expect(ymd(adapter.parse('12/25/2024'))).toEqual([2024, 12, 25]);
  });

  it('rejects impossible dates instead of rolling them over', () => {
    adapter.setLocale('pt-BR');
    expect(ymd(adapter.parse('31/02/2024'))).toBeNull();
    expect(ymd(adapter.parse('10/13/2024'))).toBeNull();
    expect(ymd(adapter.parse('not a date'))).toBeNull();
  });

  it('returns null for empty input and passes Date through', () => {
    expect(adapter.parse('  ')).toBeNull();
    const date = new Date(2024, 0, 1);
    expect(adapter.parse(date)).toBe(date);
  });
});
