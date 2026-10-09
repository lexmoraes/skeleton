import { Component, DestroyRef, OnInit, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoService } from '@jsverse/transloco';

const DATEPICKER_LOCALE: Record<string, string> = { pt: 'pt-BR', en: 'en-US' };

/**
 * Standard date-selection control for the app: a Material datepicker wired
 * up as a ControlValueAccessor, so it drops into any reactive form exactly
 * like a native input (`<app-date-field formControlName="...">`). Locale
 * (month/day names) follows the active Transloco language live.
 *
 * Delegates to an internal FormControl bound via [formControl] on the
 * Material input — this is what MatDatepickerInput actually expects for
 * correct two-way sync of typed/pasted text, not just calendar selection.
 * The value is forwarded to the outer CVA via the (dateInput) template
 * event rather than a class-level valueChanges subscription: this app runs
 * zoneless (no zone.js), so only Angular-instrumented paths — template
 * event bindings, signals — trigger change detection; an imperative
 * subscription callback would update the form silently without a re-render.
 */
@Component({
  selector: 'app-date-field',
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, ReactiveFormsModule],
  templateUrl: './date-field.html',
  styleUrl: './date-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateField),
      multi: true,
    },
  ],
})
export class DateField implements ControlValueAccessor, OnInit {
  private readonly dateAdapter = inject(DateAdapter<Date>);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly label = input.required<string>();
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);

  protected readonly control = new FormControl<Date | null>(null);

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.setLocale(this.transloco.getActiveLang());
    const sub = this.transloco.langChanges$.subscribe((lang) => this.setLocale(lang));
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  writeValue(value: Date | null): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  protected onDateInput(event: MatDatepickerInputEvent<Date>): void {
    this.onChange(event.value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private setLocale(lang: string): void {
    this.dateAdapter.setLocale(DATEPICKER_LOCALE[lang] ?? 'en-US');
  }
}
