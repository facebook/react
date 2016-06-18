import {Type} from '@angular/core';

import {CheckboxControlValueAccessor} from './directives/checkbox_value_accessor';
import {DefaultValueAccessor} from './directives/default_value_accessor';
import {NgControlGroup} from './directives/ng_control_group';
import {NgControlName} from './directives/ng_control_name';
import {NgControlStatus} from './directives/ng_control_status';
import {NgForm} from './directives/ng_form';
import {NgFormControl} from './directives/ng_form_control';
import {NgFormModel} from './directives/ng_form_model';
import {NgModel} from './directives/ng_model';
import {NumberValueAccessor} from './directives/number_value_accessor';
import {RadioControlValueAccessor} from './directives/radio_control_value_accessor';
import {NgSelectOption, SelectControlValueAccessor} from './directives/select_control_value_accessor';
import {NgSelectMultipleOption, SelectMultipleControlValueAccessor} from './directives/select_multiple_control_value_accessor';
import {MaxLengthValidator, MinLengthValidator, PatternValidator, RequiredValidator} from './directives/validators';

export {CheckboxControlValueAccessor} from './directives/checkbox_value_accessor';
export {ControlValueAccessor} from './directives/control_value_accessor';
export {DefaultValueAccessor} from './directives/default_value_accessor';
export {NgControl} from './directives/ng_control';
export {NgControlGroup} from './directives/ng_control_group';
export {NgControlName} from './directives/ng_control_name';
export {NgControlStatus} from './directives/ng_control_status';
export {NgForm} from './directives/ng_form';
export {NgFormControl} from './directives/ng_form_control';
export {NgFormModel} from './directives/ng_form_model';
export {NgModel} from './directives/ng_model';
export {NumberValueAccessor} from './directives/number_value_accessor';
export {RadioButtonState, RadioControlValueAccessor} from './directives/radio_control_value_accessor';
export {NgSelectOption, SelectControlValueAccessor} from './directives/select_control_value_accessor';
export {NgSelectMultipleOption, SelectMultipleControlValueAccessor} from './directives/select_multiple_control_value_accessor';
export {MaxLengthValidator, MinLengthValidator, PatternValidator, RequiredValidator} from './directives/validators';


/**
 *
 * A list of all the form directives used as part of a `@Component` annotation.
 *
 *  This is a shorthand for importing them each individually.
 *
 * ### Example
 *
 * ```typescript
 * @Component({
 *   selector: 'my-app',
 *   directives: [FORM_DIRECTIVES]
 * })
 * class MyApp {}
 * ```
 * @experimental
 */
export const FORM_DIRECTIVES: Type[] = /*@ts2dart_const*/[
  NgControlName,
  NgControlGroup,

  NgFormControl,
  NgModel,
  NgFormModel,
  NgForm,

  NgSelectOption,
  NgSelectMultipleOption,
  DefaultValueAccessor,
  NumberValueAccessor,
  CheckboxControlValueAccessor,
  SelectControlValueAccessor,
  SelectMultipleControlValueAccessor,
  RadioControlValueAccessor,
  NgControlStatus,

  RequiredValidator,
  MinLengthValidator,
  MaxLengthValidator,
  PatternValidator,
];
