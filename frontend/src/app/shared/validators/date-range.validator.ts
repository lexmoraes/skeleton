import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Form-group validator: fails with `{ dateRange: true }` when the start date is after the end date. */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as Date | null;
    const end = group.get(endKey)?.value as Date | null;
    if (!start || !end) return null;
    return start.getTime() > end.getTime() ? { dateRange: true } : null;
  };
}
