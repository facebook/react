import {Directive, ElementRef, Injectable, Injector, Input, OnDestroy, OnInit, Renderer, forwardRef} from '@angular/core';

import {ListWrapper} from '../facade/collection';
import {isPresent} from '../facade/lang';

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
        c[1].fireUncheck(accessor.value);
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
 * The accessor for writing a radio control value and listening to changes that is used by the
 * {@link NgModel}, {@link FormControlDirective}, and {@link FormControlName} directives.
 *
 *  ### Example
 *  ```
 *  @Component({
 *    template: `
 *      <input type="radio" name="food" [(ngModel)]="food" value="chicken">
 *      <input type="radio" name="food" [(ngModel)]="food" value="fish">
 *    `
 *  })
 *  class FoodCmp {
 *    food = 'chicken';
 *  }
 *  ```
 */
@Directive({
  selector:
      'input[type=radio][formControlName],input[type=radio][formControl],input[type=radio][ngModel]',
  host: {'(change)': 'onChange()', '(blur)': 'onTouched()'},
  providers: [RADIO_VALUE_ACCESSOR]
})
export class RadioControlValueAccessor implements ControlValueAccessor,
    OnDestroy, OnInit {
  /** @internal */
  _state: boolean;
  /** @internal */
  _control: NgControl;
  /** @internal */
  _fn: Function;
  onChange = () => {};
  onTouched = () => {}

  @Input() name: string;
  @Input() value: any;

  constructor(
      private _renderer: Renderer, private _elementRef: ElementRef,
      private _registry: RadioControlRegistry, private _injector: Injector) {}

  ngOnInit(): void {
    this._control = this._injector.get(NgControl);
    this._registry.add(this._control, this);
  }

  ngOnDestroy(): void { this._registry.remove(this); }

  writeValue(value: any): void {
    this._state = value === this.value;
    if (isPresent(value)) {
      this._renderer.setElementProperty(this._elementRef.nativeElement, 'checked', this._state);
    }
  }

  registerOnChange(fn: (_: any) => {}): void {
    this._fn = fn;
    this.onChange = () => {
      fn(this.value);
      this._registry.select(this);
    };
  }

  fireUncheck(value: any): void { this.writeValue(value); }

  registerOnTouched(fn: () => {}): void { this.onTouched = fn; }
}
