import {Directive, ElementRef, Injectable, Injector, Input, OnDestroy, OnInit, Renderer, forwardRef} from '@angular/core';

import {ListWrapper} from '../../facade/collection';
import {isPresent} from '../../facade/lang';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from './control_value_accessor';
import {NgControl} from './ng_control';

export const RADIO_VALUE_ACCESSOR: any = /*@ts2dart_const*/ /*@ts2dart_Provider*/ {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => RadioControlValueAccessor),
  multi: true
};

/**
 * Internal class used by Angular to uncheck radio buttons with the matching name.
 */
@Injectable()
export class RadioControlRegistry {
  private _accessors: any[] = [];

  add(control: NgControl, accessor: RadioControlValueAccessor) {
    this._accessors.push([control, accessor]);
  }

  remove(accessor: RadioControlValueAccessor) {
    var indexToRemove = -1;
    for (var i = 0; i < this._accessors.length; ++i) {
      if (this._accessors[i][1] === accessor) {
        indexToRemove = i;
      }
    }
    ListWrapper.removeAt(this._accessors, indexToRemove);
  }

  select(accessor: RadioControlValueAccessor) {
    this._accessors.forEach((c) => {
      if (this._isSameGroup(c, accessor) && c[1] !== accessor) {
        c[1].fireUncheck();
      }
    });
  }

  private _isSameGroup(
      controlPair: [NgControl, RadioControlValueAccessor], accessor: RadioControlValueAccessor) {
    return controlPair[0].control.root === accessor._control.control.root &&
        controlPair[1].name === accessor.name;
  }
}

/**
 * The value provided by the forms API for radio buttons.
 *
 * @experimental
 */
export class RadioButtonState {
  constructor(public checked: boolean, public value: string) {}
}


/**
 * The accessor for writing a radio control value and listening to changes that is used by the
 * {@link NgModel}, {@link NgFormControl}, and {@link NgControlName} directives.
 *
 *  ### Example
 *  ```
 *  @Component({
 *    template: `
 *      <input type="radio" name="food" [(ngModel)]="foodChicken">
 *      <input type="radio" name="food" [(ngModel)]="foodFish">
 *    `
 *  })
 *  class FoodCmp {
 *    foodChicken = new RadioButtonState(true, "chicken");
 *    foodFish = new RadioButtonState(false, "fish");
 *  }
 *  ```
 */
@Directive({
  selector:
      'input[type=radio][ngControl],input[type=radio][ngFormControl],input[type=radio][ngModel]',
  host: {'(change)': 'onChange()', '(blur)': 'onTouched()'},
  providers: [RADIO_VALUE_ACCESSOR]
})
export class RadioControlValueAccessor implements ControlValueAccessor,
    OnDestroy, OnInit {
  /** @internal */
  _state: RadioButtonState;
  /** @internal */
  _control: NgControl;
  @Input() name: string;
  /** @internal */
  _fn: Function;
  onChange = () => {};
  onTouched = () => {};

  constructor(
      private _renderer: Renderer, private _elementRef: ElementRef,
      private _registry: RadioControlRegistry, private _injector: Injector) {}

  ngOnInit(): void {
    this._control = this._injector.get(NgControl);
    this._registry.add(this._control, this);
  }

  ngOnDestroy(): void { this._registry.remove(this); }

  writeValue(value: any): void {
    this._state = value;
    if (isPresent(value) && value.checked) {
      this._renderer.setElementProperty(this._elementRef.nativeElement, 'checked', true);
    }
  }

  registerOnChange(fn: (_: any) => {}): void {
    this._fn = fn;
    this.onChange = () => {
      fn(new RadioButtonState(true, this._state.value));
      this._registry.select(this);
    };
  }

  fireUncheck(): void { this._fn(new RadioButtonState(false, this._state.value)); }

  registerOnTouched(fn: () => {}): void { this.onTouched = fn; }
}
