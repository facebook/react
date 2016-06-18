import {composeAsyncValidators, composeValidators} from './directives/shared';
import {AsyncValidatorFn, ValidatorFn} from './directives/validators';
import {EventEmitter, Observable, ObservableWrapper} from './facade/async';
import {ListWrapper, StringMapWrapper} from './facade/collection';
import {isBlank, isPresent, normalizeBool} from './facade/lang';
import {PromiseWrapper} from './facade/promise';



/**
 * Indicates that a FormControl is valid, i.e. that no errors exist in the input value.
 */
export const VALID = 'VALID';

/**
 * Indicates that a FormControl is invalid, i.e. that an error exists in the input value.
 */
export const INVALID = 'INVALID';

/**
 * Indicates that a FormControl is pending, i.e. that async validation is occurring and
 * errors are not yet available for the input value.
 */
export const PENDING = 'PENDING';

export function isControl(control: Object): boolean {
  return control instanceof AbstractControl;
}

function _find(control: AbstractControl, path: Array<string|number>| string) {
  if (isBlank(path)) return null;

  if (!(path instanceof Array)) {
    path = (<string>path).split('/');
  }
  if (path instanceof Array && ListWrapper.isEmpty(path)) return null;

  return (<Array<string|number>>path).reduce((v, name) => {
    if (v instanceof FormGroup) {
      return isPresent(v.controls[name]) ? v.controls[name] : null;
    } else if (v instanceof FormArray) {
      var index = <number>name;
      return isPresent(v.at(index)) ? v.at(index) : null;
    } else {
      return null;
    }
  }, control);
}

function toObservable(r: any): Observable<any> {
  return PromiseWrapper.isPromise(r) ? ObservableWrapper.fromPromise(r) : r;
}

function coerceToValidator(validator: ValidatorFn | ValidatorFn[]): ValidatorFn {
  return Array.isArray(validator) ? composeValidators(validator) : validator;
}

function coerceToAsyncValidator(asyncValidator: AsyncValidatorFn | AsyncValidatorFn[]):
    AsyncValidatorFn {
  return Array.isArray(asyncValidator) ? composeAsyncValidators(asyncValidator) : asyncValidator;
}

/**
 * @experimental
 */
export abstract class AbstractControl {
  /** @internal */
  _value: any;

  private _valueChanges: EventEmitter<any>;
  private _statusChanges: EventEmitter<any>;
  private _status: string;
  private _errors: {[key: string]: any};
  private _pristine: boolean = true;
  private _touched: boolean = false;
  private _parent: FormGroup|FormArray;
  private _asyncValidationSubscription: any;

  constructor(public validator: ValidatorFn, public asyncValidator: AsyncValidatorFn) {}

  get value(): any { return this._value; }

  get status(): string { return this._status; }

  get valid(): boolean { return this._status === VALID; }

  /**
   * Returns the errors of this control.
   */
  get errors(): {[key: string]: any} { return this._errors; }

  get pristine(): boolean { return this._pristine; }

  get dirty(): boolean { return !this.pristine; }

  get touched(): boolean { return this._touched; }

  get untouched(): boolean { return !this._touched; }

  get valueChanges(): Observable<any> { return this._valueChanges; }

  get statusChanges(): Observable<any> { return this._statusChanges; }

  get pending(): boolean { return this._status == PENDING; }

  markAsTouched(): void { this._touched = true; }

  markAsDirty({onlySelf}: {onlySelf?: boolean} = {}): void {
    onlySelf = normalizeBool(onlySelf);
    this._pristine = false;

    if (isPresent(this._parent) && !onlySelf) {
      this._parent.markAsDirty({onlySelf: onlySelf});
    }
  }

  markAsPending({onlySelf}: {onlySelf?: boolean} = {}): void {
    onlySelf = normalizeBool(onlySelf);
    this._status = PENDING;

    if (isPresent(this._parent) && !onlySelf) {
      this._parent.markAsPending({onlySelf: onlySelf});
    }
  }

  setParent(parent: FormGroup|FormArray): void { this._parent = parent; }

  updateValueAndValidity({onlySelf, emitEvent}: {onlySelf?: boolean, emitEvent?: boolean} = {}):
      void {
    onlySelf = normalizeBool(onlySelf);
    emitEvent = isPresent(emitEvent) ? emitEvent : true;

    this._updateValue();

    this._errors = this._runValidator();
    this._status = this._calculateStatus();

    if (this._status == VALID || this._status == PENDING) {
      this._runAsyncValidator(emitEvent);
    }

    if (emitEvent) {
      ObservableWrapper.callEmit(this._valueChanges, this._value);
      ObservableWrapper.callEmit(this._statusChanges, this._status);
    }

    if (isPresent(this._parent) && !onlySelf) {
      this._parent.updateValueAndValidity({onlySelf: onlySelf, emitEvent: emitEvent});
    }
  }

  private _runValidator(): {[key: string]: any} {
    return isPresent(this.validator) ? this.validator(this) : null;
  }

  private _runAsyncValidator(emitEvent: boolean): void {
    if (isPresent(this.asyncValidator)) {
      this._status = PENDING;
      this._cancelExistingSubscription();
      var obs = toObservable(this.asyncValidator(this));
      this._asyncValidationSubscription = ObservableWrapper.subscribe(
          obs, (res: {[key: string]: any}) => this.setErrors(res, {emitEvent: emitEvent}));
    }
  }

  private _cancelExistingSubscription(): void {
    if (isPresent(this._asyncValidationSubscription)) {
      ObservableWrapper.dispose(this._asyncValidationSubscription);
    }
  }

  /**
   * Sets errors on a form control.
   *
   * This is used when validations are run not automatically, but manually by the user.
   *
   * Calling `setErrors` will also update the validity of the parent control.
   *
   * ## Usage
   *
   * ```
   * var login = new FormControl("someLogin");
   * login.setErrors({
   *   "notUnique": true
   * });
   *
   * expect(login.valid).toEqual(false);
   * expect(login.errors).toEqual({"notUnique": true});
   *
   * login.updateValue("someOtherLogin");
   *
   * expect(login.valid).toEqual(true);
   * ```
   */
  setErrors(errors: {[key: string]: any}, {emitEvent}: {emitEvent?: boolean} = {}): void {
    emitEvent = isPresent(emitEvent) ? emitEvent : true;

    this._errors = errors;
    this._status = this._calculateStatus();

    if (emitEvent) {
      ObservableWrapper.callEmit(this._statusChanges, this._status);
    }

    if (isPresent(this._parent)) {
      this._parent._updateControlsErrors();
    }
  }

  find(path: Array<string|number>|string): AbstractControl { return _find(this, path); }

  getError(errorCode: string, path: string[] = null): any {
    var control = isPresent(path) && !ListWrapper.isEmpty(path) ? this.find(path) : this;
    if (isPresent(control) && isPresent(control._errors)) {
      return StringMapWrapper.get(control._errors, errorCode);
    } else {
      return null;
    }
  }

  hasError(errorCode: string, path: string[] = null): boolean {
    return isPresent(this.getError(errorCode, path));
  }

  get root(): AbstractControl {
    let x: AbstractControl = this;

    while (isPresent(x._parent)) {
      x = x._parent;
    }

    return x;
  }

  /** @internal */
  _updateControlsErrors(): void {
    this._status = this._calculateStatus();

    if (isPresent(this._parent)) {
      this._parent._updateControlsErrors();
    }
  }

  /** @internal */
  _initObservables() {
    this._valueChanges = new EventEmitter();
    this._statusChanges = new EventEmitter();
  }


  private _calculateStatus(): string {
    if (isPresent(this._errors)) return INVALID;
    if (this._anyControlsHaveStatus(PENDING)) return PENDING;
    if (this._anyControlsHaveStatus(INVALID)) return INVALID;
    return VALID;
  }

  /** @internal */
  abstract _updateValue(): void;

  /** @internal */
  abstract _anyControlsHaveStatus(status: string): boolean;
}

/**
 * Defines a part of a form that cannot be divided into other controls. `FormControl`s have values
 * and
 * validation state, which is determined by an optional validation function.
 *
 * `FormControl` is one of the three fundamental building blocks used to define forms in Angular,
 * along
 * with {@link FormGroup} and {@link FormArray}.
 *
 * ## Usage
 *
 * By default, a `FormControl` is created for every `<input>` or other form component.
 * With {@link FormControlDirective} or {@link FormGroupDirective} an existing {@link FormControl}
 * can be bound to a DOM element instead. This `FormControl` can be configured with a custom
 * validation function.
 *
 * @experimental
 */
export class FormControl extends AbstractControl {
  /** @internal */
  _onChange: Function[] = [];

  constructor(
      value: any = null, validator: ValidatorFn|ValidatorFn[] = null,
      asyncValidator: AsyncValidatorFn|AsyncValidatorFn[] = null) {
    super(coerceToValidator(validator), coerceToAsyncValidator(asyncValidator));
    this._value = value;
    this.updateValueAndValidity({onlySelf: true, emitEvent: false});
    this._initObservables();
  }

  /**
   * Set the value of the form control to `value`.
   *
   * If `onlySelf` is `true`, this change will only affect the validation of this `FormControl`
   * and not its parent component. If `emitEvent` is `true`, this change will cause a
   * `valueChanges` event on the `FormControl` to be emitted. Both of these options default to
   * `false`.
   *
   * If `emitModelToViewChange` is `true`, the view will be notified about the new value
   * via an `onChange` event. This is the default behavior if `emitModelToViewChange` is not
   * specified.
   */
  updateValue(value: any, {onlySelf, emitEvent, emitModelToViewChange}: {
    onlySelf?: boolean,
    emitEvent?: boolean,
    emitModelToViewChange?: boolean
  } = {}): void {
    emitModelToViewChange = isPresent(emitModelToViewChange) ? emitModelToViewChange : true;
    this._value = value;
    if (this._onChange.length && emitModelToViewChange) {
      this._onChange.forEach((changeFn) => changeFn(this._value));
    }
    this.updateValueAndValidity({onlySelf: onlySelf, emitEvent: emitEvent});
  }

  /**
   * @internal
   */
  _updateValue() {}

  /**
   * @internal
   */
  _anyControlsHaveStatus(status: string): boolean { return false; }

  /**
   * Register a listener for change events.
   */
  registerOnChange(fn: Function): void { this._onChange.push(fn); }
}

/**
 * Defines a part of a form, of fixed length, that can contain other controls.
 *
 * A `FormGroup` aggregates the values of each {@link FormControl} in the group.
 * The status of a `FormGroup` depends on the status of its children.
 * If one of the controls in a group is invalid, the entire group is invalid.
 * Similarly, if a control changes its value, the entire group changes as well.
 *
 * `FormGroup` is one of the three fundamental building blocks used to define forms in Angular,
 * along with {@link FormControl} and {@link FormArray}. {@link FormArray} can also contain other
 * controls, but is of variable length.
 *
 * ### Example ([live demo](http://plnkr.co/edit/23DESOpbNnBpBHZt1BR4?p=preview))
 *
 * @experimental
 */
export class FormGroup extends AbstractControl {
  private _optionals: {[key: string]: boolean};

  constructor(
      public controls: {[key: string]: AbstractControl}, optionals: {[key: string]: boolean} = null,
      validator: ValidatorFn = null, asyncValidator: AsyncValidatorFn = null) {
    super(validator, asyncValidator);
    this._optionals = isPresent(optionals) ? optionals : {};
    this._initObservables();
    this._setParentForControls();
    this.updateValueAndValidity({onlySelf: true, emitEvent: false});
  }

  /**
   * Register a control with the group's list of controls.
   */
  registerControl(name: string, control: AbstractControl): AbstractControl {
    if (this.controls[name]) return this.controls[name];
    this.controls[name] = control;
    control.setParent(this);
    return control;
  }

  /**
   * Add a control to this group.
   */
  addControl(name: string, control: AbstractControl): void {
    this.registerControl(name, control);
    this.updateValueAndValidity();
  }

  /**
   * Remove a control from this group.
   */
  removeControl(name: string): void {
    StringMapWrapper.delete(this.controls, name);
    this.updateValueAndValidity();
  }

  /**
   * Mark the named control as non-optional.
   */
  include(controlName: string): void {
    StringMapWrapper.set(this._optionals, controlName, true);
    this.updateValueAndValidity();
  }

  /**
   * Mark the named control as optional.
   */
  exclude(controlName: string): void {
    StringMapWrapper.set(this._optionals, controlName, false);
    this.updateValueAndValidity();
  }

  /**
   * Check whether there is a control with the given name in the group.
   */
  contains(controlName: string): boolean {
    var c = StringMapWrapper.contains(this.controls, controlName);
    return c && this._included(controlName);
  }

  /** @internal */
  _setParentForControls() {
    StringMapWrapper.forEach(
        this.controls, (control: AbstractControl, name: string) => { control.setParent(this); });
  }

  /** @internal */
  _updateValue() { this._value = this._reduceValue(); }

  /** @internal */
  _anyControlsHaveStatus(status: string): boolean {
    var res = false;
    StringMapWrapper.forEach(this.controls, (control: AbstractControl, name: string) => {
      res = res || (this.contains(name) && control.status == status);
    });
    return res;
  }

  /** @internal */
  _reduceValue() {
    return this._reduceChildren(
        {}, (acc: {[k: string]: AbstractControl}, control: AbstractControl, name: string) => {
          acc[name] = control.value;
          return acc;
        });
  }

  /** @internal */
  _reduceChildren(initValue: any, fn: Function) {
    var res = initValue;
    StringMapWrapper.forEach(this.controls, (control: AbstractControl, name: string) => {
      if (this._included(name)) {
        res = fn(res, control, name);
      }
    });
    return res;
  }

  /** @internal */
  _included(controlName: string): boolean {
    var isOptional = StringMapWrapper.contains(this._optionals, controlName);
    return !isOptional || StringMapWrapper.get(this._optionals, controlName);
  }
}

/**
 * Defines a part of a form, of variable length, that can contain other controls.
 *
 * A `FormArray` aggregates the values of each {@link FormControl} in the group.
 * The status of a `FormArray` depends on the status of its children.
 * If one of the controls in a group is invalid, the entire array is invalid.
 * Similarly, if a control changes its value, the entire array changes as well.
 *
 * `FormArray` is one of the three fundamental building blocks used to define forms in Angular,
 * along with {@link FormControl} and {@link FormGroup}. {@link FormGroup} can also contain
 * other controls, but is of fixed length.
 *
 * ## Adding or removing controls
 *
 * To change the controls in the array, use the `push`, `insert`, or `removeAt` methods
 * in `FormArray` itself. These methods ensure the controls are properly tracked in the
 * form's hierarchy. Do not modify the array of `AbstractControl`s used to instantiate
 * the `FormArray` directly, as that will result in strange and unexpected behavior such
 * as broken change detection.
 *
 * ### Example ([live demo](http://plnkr.co/edit/23DESOpbNnBpBHZt1BR4?p=preview))
 *
 * @experimental
 */
export class FormArray extends AbstractControl {
  constructor(
      public controls: AbstractControl[], validator: ValidatorFn = null,
      asyncValidator: AsyncValidatorFn = null) {
    super(validator, asyncValidator);
    this._initObservables();
    this._setParentForControls();
    this.updateValueAndValidity({onlySelf: true, emitEvent: false});
  }

  /**
   * Get the {@link AbstractControl} at the given `index` in the array.
   */
  at(index: number): AbstractControl { return this.controls[index]; }

  /**
   * Insert a new {@link AbstractControl} at the end of the array.
   */
  push(control: AbstractControl): void {
    this.controls.push(control);
    control.setParent(this);
    this.updateValueAndValidity();
  }

  /**
   * Insert a new {@link AbstractControl} at the given `index` in the array.
   */
  insert(index: number, control: AbstractControl): void {
    ListWrapper.insert(this.controls, index, control);
    control.setParent(this);
    this.updateValueAndValidity();
  }

  /**
   * Remove the control at the given `index` in the array.
   */
  removeAt(index: number): void {
    ListWrapper.removeAt(this.controls, index);
    this.updateValueAndValidity();
  }

  /**
   * Length of the control array.
   */
  get length(): number { return this.controls.length; }

  /** @internal */
  _updateValue(): void { this._value = this.controls.map((control) => control.value); }

  /** @internal */
  _anyControlsHaveStatus(status: string): boolean {
    return this.controls.some(c => c.status == status);
  }


  /** @internal */
  _setParentForControls(): void {
    this.controls.forEach((control) => { control.setParent(this); });
  }
}
