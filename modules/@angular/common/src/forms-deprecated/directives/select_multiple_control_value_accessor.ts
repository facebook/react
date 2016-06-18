import {Directive, ElementRef, Host, Input, OnDestroy, Optional, Renderer, forwardRef} from '@angular/core';

import {MapWrapper} from '../../facade/collection';
import {StringWrapper, isBlank, isPresent, isPrimitive, isString, looseIdentical} from '../../facade/lang';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from './control_value_accessor';

const SELECT_MULTIPLE_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectMultipleControlValueAccessor),
  multi: true
};

function _buildValueString(id: string, value: any): string {
  if (isBlank(id)) return `${value}`;
  if (isString(value)) value = `'${value}'`;
  if (!isPrimitive(value)) value = 'Object';
  return StringWrapper.slice(`${id}: ${value}`, 0, 50);
}

function _extractId(valueString: string): string {
  return valueString.split(':')[0];
}

/** Mock interface for HTML Options */
interface HTMLOption {
  value: string;
  selected: boolean;
}

/** Mock interface for HTMLCollection */
abstract class HTMLCollection {
  length: number;
  abstract item(_: number): HTMLOption;
}

/**
 * The accessor for writing a value and listening to changes on a select element.
 */
@Directive({
  selector: 'select[multiple][ngControl],select[multiple][ngFormControl],select[multiple][ngModel]',
  host: {'(input)': 'onChange($event.target)', '(blur)': 'onTouched()'},
  providers: [SELECT_MULTIPLE_VALUE_ACCESSOR]
})
export class SelectMultipleControlValueAccessor implements ControlValueAccessor {
  value: any;
  /** @internal */
  _optionMap: Map<string, NgSelectMultipleOption> = new Map<string, NgSelectMultipleOption>();
  /** @internal */
  _idCounter: number = 0;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor() {}

  writeValue(value: any): void {
    this.value = value;
    if (value == null) return;
    let values: Array<any> = <Array<any>>value;
    // convert values to ids
    let ids = values.map((v) => this._getOptionId(v));
    this._optionMap.forEach((opt, o) => { opt._setSelected(ids.indexOf(o.toString()) > -1); });
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = (_: any) => {
      let selected: Array<any> = [];
      if (_.hasOwnProperty('selectedOptions')) {
        let options: HTMLCollection = _.selectedOptions;
        for (var i = 0; i < options.length; i++) {
          let opt: any = options.item(i);
          let val: any = this._getOptionValue(opt.value);
          selected.push(val);
        }
      }
      // Degrade on IE
      else {
        let options: HTMLCollection = <HTMLCollection>_.options;
        for (var i = 0; i < options.length; i++) {
          let opt: HTMLOption = options.item(i);
          if (opt.selected) {
            let val: any = this._getOptionValue(opt.value);
            selected.push(val);
          }
        }
      }
      fn(selected);
    };
  }
  registerOnTouched(fn: () => any): void { this.onTouched = fn; }

  /** @internal */
  _registerOption(value: NgSelectMultipleOption): string {
    let id: string = (this._idCounter++).toString();
    this._optionMap.set(id, value);
    return id;
  }

  /** @internal */
  _getOptionId(value: any): string {
    for (let id of MapWrapper.keys(this._optionMap)) {
      if (looseIdentical(this._optionMap.get(id)._value, value)) return id;
    }
    return null;
  }

  /** @internal */
  _getOptionValue(valueString: string): any {
    let opt = this._optionMap.get(_extractId(valueString));
    return isPresent(opt) ? opt._value : valueString;
  }
}

/**
 * Marks `<option>` as dynamic, so Angular can be notified when options change.
 *
 * ### Example
 *
 * ```
 * <select multiple ngControl="city">
 *   <option *ngFor="let c of cities" [value]="c"></option>
 * </select>
 * ```
 */
@Directive({selector: 'option'})
export class NgSelectMultipleOption implements OnDestroy {
  id: string;
  /** @internal */
  _value: any;

  constructor(
      private _element: ElementRef, private _renderer: Renderer,
      @Optional() @Host() private _select: SelectMultipleControlValueAccessor) {
    if (isPresent(this._select)) {
      this.id = this._select._registerOption(this);
    }
  }

  @Input('ngValue')
  set ngValue(value: any) {
    if (this._select == null) return;
    this._value = value;
    this._setElementValue(_buildValueString(this.id, value));
    this._select.writeValue(this._select.value);
  }

  @Input('value')
  set value(value: any) {
    if (isPresent(this._select)) {
      this._value = value;
      this._setElementValue(_buildValueString(this.id, value));
      this._select.writeValue(this._select.value);
    } else {
      this._setElementValue(value);
    }
  }

  /** @internal */
  _setElementValue(value: string): void {
    this._renderer.setElementProperty(this._element.nativeElement, 'value', value);
  }

  /** @internal */
  _setSelected(selected: boolean) {
    this._renderer.setElementProperty(this._element.nativeElement, 'selected', selected);
  }

  ngOnDestroy() {
    if (isPresent(this._select)) {
      this._select._optionMap.delete(this.id);
      this._select.writeValue(this._select.value);
    }
  }
}

export const SELECT_DIRECTIVES = [SelectMultipleControlValueAccessor, NgSelectMultipleOption];