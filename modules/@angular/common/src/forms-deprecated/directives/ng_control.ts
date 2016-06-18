import {unimplemented} from '../../facade/exceptions';

import {AbstractControlDirective} from './abstract_control_directive';
import {ControlValueAccessor} from './control_value_accessor';
import {AsyncValidatorFn, ValidatorFn} from './validators';


/**
 * A base class that all control directive extend.
 * It binds a {@link Control} object to a DOM element.
 *
 * Used internally by Angular forms.
 *
 * @experimental
 */
export abstract class NgControl extends AbstractControlDirective {
  name: string = null;
  valueAccessor: ControlValueAccessor = null;

  get validator(): ValidatorFn { return <ValidatorFn>unimplemented(); }
  get asyncValidator(): AsyncValidatorFn { return <AsyncValidatorFn>unimplemented(); }

  abstract viewToModelUpdate(newValue: any): void;
}
