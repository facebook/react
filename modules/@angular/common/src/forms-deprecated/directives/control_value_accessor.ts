import {OpaqueToken} from '@angular/core';

/**
 * A bridge between a control and a native element.
 *
 * A `ControlValueAccessor` abstracts the operations of writing a new value to a
 * DOM element representing an input control.
 *
 * Please see {@link DefaultValueAccessor} for more information.
 *
 * @experimental
 */
export interface ControlValueAccessor {
  /**
   * Write a new value to the element.
   */
  writeValue(obj: any): void;

  /**
   * Set the function to be called when the control receives a change event.
   */
  registerOnChange(fn: any): void;

  /**
   * Set the function to be called when the control receives a touch event.
   */
  registerOnTouched(fn: any): void;
}

/**
 * Used to provide a {@link ControlValueAccessor} for form controls.
 *
 * See {@link DefaultValueAccessor} for how to implement one.
 * @experimental
 */
export const NG_VALUE_ACCESSOR: OpaqueToken =
    /*@ts2dart_const*/ new OpaqueToken('NgValueAccessor');
