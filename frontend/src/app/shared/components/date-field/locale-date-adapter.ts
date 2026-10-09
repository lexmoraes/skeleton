import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * NativeDateAdapter.parse() just delegates to JS's Date.parse(), which is
 * locale-agnostic and assumes US MM/DD/YYYY ordering — so typing a pt-BR
 * DD/MM/YYYY date (anything with a day > 12) silently fails to parse. This
 * adapter parses numeric d/M/y strings itself, honoring whichever field
 * order this.locale actually uses (day-first for every locale except
 * en-US), instead of guessing via the native Date constructor.
 */
@Injectable()
export class LocaleDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' || !value.trim()) return null;

    const parts = value.trim().split(/[/\-.]/).map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) {
      return new Date(NaN);
    }

    const [first, second, year] = parts;
    const [day, month] = this.locale === 'en-US' ? [second, first] : [first, second];
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return new Date(NaN);
    }

    const date = new Date(year, month - 1, day);
    return date.getMonth() === month - 1 ? date : new Date(NaN);
  }
}
