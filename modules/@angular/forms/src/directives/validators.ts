import {Attribute, Directive, forwardRef} from '@angular/core';

import {NumberWrapper} from '../facade/lang';
import {AbstractControl} from '../model';
import {NG_VALIDATORS, Validators} from '../validators';



/**
 * An interface that can be implemented by classes that can act as validators.
 *
 * ## Usage
 *
 * ```typescript
 * @Directive({
 *   selector: '[custom-validator]',
 *   providers: [{provide: NG_VALIDATORS, useExisting: CustomValidatorDirective, multi: true}]
 * })
 * class CustomValidatorDirective implements Validator {
 *   validate(c: Control): {[key: string]: any} {
 *     return {"custom": true};
 *   }
 * }
 * ```
 */
export interface Validator { validate(c: AbstractControl): {[key: string]: any}; }

const REQUIRED = /*@ts2dart_const*/ Validators.required;

export const REQUIRED_VALIDATOR: any = /*@ts2dart_const*/ /*@ts2dart_Provider*/ {
  provide: NG_VALIDATORS,
  useValue: REQUIRED,
  multi: true
};

/**
 * A Directive that adds the `required` validator to any controls marked with the
 * `required` attribute, via the {@link NG_VALIDATORS} binding.
 *
 * ### Example
 *
 * ```
 * <input name="fullName" ngModel required>
 * ```
 *
 * @experimental
 */
@Directive({
  selector: '[required][formControlName],[required][formControl],[required][ngModel]',
  providers: [REQUIRED_VALIDATOR]
})
export class RequiredValidator {
}

export interface ValidatorFn { (c: AbstractControl): {[key: string]: any}; }
export interface AsyncValidatorFn {
  (c: AbstractControl): any /*Promise<{[key: string]: any}>|Observable<{[key: string]: any}>*/;
}

/**
 * Provivder which adds {@link MinLengthValidator} to {@link NG_VALIDATORS}.
 *
 * ## Example:
 *
 * {@example common/forms/ts/validators/validators.ts region='min'}
 */
export const MIN_LENGTH_VALIDATOR: any = /*@ts2dart_const*/ /*@ts2dart_Provider*/ {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MinLengthValidator),
  multi: true
};

/**
 * A directive which installs the {@link MinLengthValidator} for any `formControlName`,
 * `formControl`, or control with `ngModel` that also has a `minlength` attribute.
 *
 * @experimental
 */
@Directive({
  selector: '[minlength][formControlName],[minlength][formControl],[minlength][ngModel]',
  providers: [MIN_LENGTH_VALIDATOR]
})
export class MinLengthValidator implements Validator {
  private _validator: ValidatorFn;

  constructor(@Attribute('minlength') minLength: string) {
    this._validator = Validators.minLength(NumberWrapper.parseInt(minLength, 10));
  }

  validate(c: AbstractControl): {[key: string]: any} { return this._validator(c); }
}

/**
 * Provider which adds {@link MaxLengthValidator} to {@link NG_VALIDATORS}.
 *
 * ## Example:
 *
 * {@example common/forms/ts/validators/validators.ts region='max'}
 */
export const MAX_LENGTH_VALIDATOR: any = /*@ts2dart_const*/ /*@ts2dart_Provider*/ {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MaxLengthValidator),
  multi: true
};

/**
 * A directive which installs the {@link MaxLengthValidator} for any `formControlName,
 * `formControl`,
 * or control with `ngModel` that also has a `maxlength` attribute.
 *
 * @experimental
 */
@Directive({
  selector: '[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]',
  providers: [MAX_LENGTH_VALIDATOR]
})
export class MaxLengthValidator implements Validator {
  private _validator: ValidatorFn;

  constructor(@Attribute('maxlength') maxLength: string) {
    this._validator = Validators.maxLength(NumberWrapper.parseInt(maxLength, 10));
  }

  validate(c: AbstractControl): {[key: string]: any} { return this._validator(c); }
}


export const PATTERN_VALIDATOR: any = /*@ts2dart_const*/ /*@ts2dart_Provider*/ {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => PatternValidator),
  multi: true
};


/**
 * A Directive that adds the `pattern` validator to any controls marked with the
 * `pattern` attribute, via the {@link NG_VALIDATORS} binding. Uses attribute value
 * as the regex to validate Control value against.  Follows pattern attribute
 * semantics; i.e. regex must match entire Control value.
 *
 * ### Example
 *
 * ```
 * <input [name]="fullName" pattern="[a-zA-Z ]*" ngModel>
 * ```
 * @experimental
 */
@Directive({
  selector: '[pattern][formControlName],[pattern][formControl],[pattern][ngModel]',
  providers: [PATTERN_VALIDATOR]
})
export class PatternValidator implements Validator {
  private _validator: ValidatorFn;

  constructor(@Attribute('pattern') pattern: string) {
    this._validator = Validators.pattern(pattern);
  }

  validate(c: AbstractControl): {[key: string]: any} { return this._validator(c); }
}
