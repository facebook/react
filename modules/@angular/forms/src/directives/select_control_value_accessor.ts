import {Directive, ElementRef, Host, Input, OnDestroy, Optional, Renderer, forwardRef} from '@angular/core';

import {MapWrapper} from '../facade/collection';
import {StringWrapper, isBlank, isPresent, isPrimitive, looseIdentical} from '../facade/lang';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from './control_value_accessor';

export const SELECT_VALUE_ACCESSOR: any = /*@ts2dart_const*/ /*@ts2dart_Provider*/ {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectControlValueAccessor),
  multi: true
};

function _buildValueString(id: string, value: any): string {
  if (isBlank(id)) return `${value}`;
  if (!isPrimitive(value)) value = 'Object';
  return StringWrapper.slice(`${id}: ${value}`, 0, 50);
}

function _extractId(valueString: string): string {
  return valueString.split(':')[0];
}

/**
 * The accessor for writing a value and listening to changes on a select element.
 *
 * Note: We have to listen to the 'change' event because 'input' events aren't fired
 * for selects in Firefox and IE:
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1024350
 * https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/4660045/
 *
 * @experimental
 */
@Directive({
  selector:
      'select:not([multiple])[formControlName],select:not([multiple])[formControl],select:not([multiple])[ngModel]',
  host: {'(change)': 'onChange($event.target.value)', '(blur)': 'onTouched()'},
  providers: [SELECT_VALUE_ACCESSOR]
})
export class SelectControlValueAccessor implements ControlValueAccessor {
  value: any;
  /** @internal */
  _optionMap: Map<string, any> = new Map<string, any>();
  /** @internal */
  _idCounter: number = 0;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private _renderer: Renderer, private _elementRef: ElementRef) {}

  writeValue(value: any): void {
    this.value = value;
    var valueString = _buildValueString(this._getOptionId(value), value);
    this._renderer.setElementProperty(this._elementRef.nativeElement, 'value', valueString);
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = (valueString: string) => {
      this.value = valueString;
      fn(this._getOptionValue(valueString));
    };
  }
  registerOnTouched(fn: () => any): void { this.onTouched = fn; }

  /** @internal */
  _registerOption(): string { return (this._idCounter++).toString(); }

  /** @internal */
  _getOptionId(value: any): string {
    for (let id of MapWrapper.keys(this._optionMap)) {
      if (looseIdentical(this._optionMap.get(id), value)) return id;
    }
    return null;
  }

  /** @internal */
  _getOptionValue(valueString: string): any {
    let value = this._optionMap.get(_extractId(valueString));
    return isPresent(value) ? value : valueString;
  }
}

/**
 * Marks `<option>` as dynamic, so Angular can be notified when options change.
 *
 * ### Example
 *
 * ```
 * <select name="city" ngModel>
 *   <option *ngFor="let c of cities" [value]="c"></option>
 * </select>
 * ```
 *
 * @experimental
 */
@Directive({selector: 'option'})
export class NgSelectOption implements OnDestroy {
  id: string;

  constructor(
      private _element: ElementRef, private _renderer: Renderer,
      @Optional() @Host() private _select: SelectControlValueAccessor) {
    if (isPresent(this._select)) this.id = this._select._registerOption();
  }

  @Input('ngValue')
  set ngValue(value: any) {
    if (this._select == null) return;
    this._select._optionMap.set(this.id, value);
    this._setElementValue(_buildValueString(this.id, value));
    this._select.writeValue(this._select.value);
  }

  @Input('value')
  set value(value: any) {
    this._setElementValue(value);
    if (isPresent(this._select)) this._select.writeValue(this._select.value);
  }

  /** @internal */
  _setElementValue(value: string): void {
    this._renderer.setElementProperty(this._element.nativeElement, 'value', value);
  }

  ngOnDestroy() {
    if (isPresent(this._select)) {
      this._select._optionMap.delete(this.id);
      this._select.writeValue(this._select.value);
    }
  }
}
