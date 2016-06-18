import {Type} from '@angular/core';

import {CheckboxControlValueAccessor} from './directives/checkbox_value_accessor';
import {DefaultValueAccessor} from './directives/default_value_accessor';
import {NgControlStatus} from './directives/ng_control_status';
import {NgForm} from './directives/ng_form';
import {NgModel} from './directives/ng_model';
import {NgModelGroup} from './directives/ng_model_group';
import {NumberValueAccessor} from './directives/number_value_accessor';
import {RadioControlValueAccessor} from './directives/radio_control_value_accessor';
import {FormControlDirective} from './directives/reactive_directives/form_control_directive';
import {FormControlName} from './directives/reactive_directives/form_control_name';
import {FormGroupDirective} from './directives/reactive_directives/form_group_directive';
import {FormGroupName} from './directives/reactive_directives/form_group_name';
import {NgSelectOption, SelectControlValueAccessor} from './directives/select_control_value_accessor';
import {NgSelectMultipleOption, SelectMultipleControlValueAccessor} from './directives/select_multiple_control_value_accessor';
import {MaxLengthValidator, MinLengthValidator, PatternValidator, RequiredValidator} from './directives/validators';

export {CheckboxControlValueAccessor} from './directives/checkbox_value_accessor';
export {ControlValueAccessor} from './directives/control_value_accessor';
export {DefaultValueAccessor} from './directives/default_value_accessor';
export {NgControl} from './directives/ng_control';
export {NgControlStatus} from './directives/ng_control_status';
export {NgForm} from './directives/ng_form';
export {NgModel} from './directives/ng_model';
export {NgModelGroup} from './directives/ng_model_group';
export {NumberValueAccessor} from './directives/number_value_accessor';
export {RadioControlValueAccessor} from './directives/radio_control_value_accessor';
export {FormControlDirective} from './directives/reactive_directives/form_control_directive';
export {FormControlName} from './directives/reactive_directives/form_control_name';
export {FormGroupDirective} from './directives/reactive_directives/form_group_directive';
export {FormGroupName} from './directives/reactive_directives/form_group_name';
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
  NgModel, NgModelGroup, NgForm,

  NgSelectOption, NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor,
  CheckboxControlValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor,
  RadioControlValueAccessor, NgControlStatus,

  RequiredValidator, MinLengthValidator, MaxLengthValidator, PatternValidator
];

export const REACTIVE_FORM_DIRECTIVES: Type[] =
    /*@ts2dart_const*/[FormControlDirective, FormGroupDirective, FormControlName, FormGroupName];