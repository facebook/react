import {Injectable} from '@angular/core';

import {StringMapWrapper} from '../facade/collection';
import {isArray, isPresent} from '../facade/lang';

import {AsyncValidatorFn, ValidatorFn} from './directives/validators';
import * as modelModule from './model';



/**
 * Creates a form object from a user-specified configuration.
 *
 * ### Example ([live demo](http://plnkr.co/edit/ENgZo8EuIECZNensZCVr?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'my-app',
 *   viewProviders: [FORM_BINDINGS]
 *   template: `
 *     <form [ngFormModel]="loginForm">
 *       <p>Login <input ngControl="login"></p>
 *       <div ngControlGroup="passwordRetry">
 *         <p>Password <input type="password" ngControl="password"></p>
 *         <p>Confirm password <input type="password" ngControl="passwordConfirmation"></p>
 *       </div>
 *     </form>
 *     <h3>Form value:</h3>
 *     <pre>{{value}}</pre>
 *   `,
 *   directives: [FORM_DIRECTIVES]
 * })
 * export class App {
 *   loginForm: ControlGroup;
 *
 *   constructor(builder: FormBuilder) {
 *     this.loginForm = builder.group({
 *       login: ["", Validators.required],
 *       passwordRetry: builder.group({
 *         password: ["", Validators.required],
 *         passwordConfirmation: ["", Validators.required, asyncValidator]
 *       })
 *     });
 *   }
 *
 *   get value(): string {
 *     return JSON.stringify(this.loginForm.value, null, 2);
 *   }
 * }
 * ```
 *
 * @experimental
 */
@Injectable()
export class FormBuilder {
  /**
   * Construct a new {@link ControlGroup} with the given map of configuration.
   * Valid keys for the `extra` parameter map are `optionals` and `validator`.
   *
   * See the {@link ControlGroup} constructor for more details.
   */
  group(controlsConfig: {[key: string]: any}, extra: {[key: string]: any} = null):
      modelModule.ControlGroup {
    var controls = this._reduceControls(controlsConfig);
    var optionals = <{[key: string]: boolean}>(
        isPresent(extra) ? StringMapWrapper.get(extra, 'optionals') : null);
    var validator: ValidatorFn = isPresent(extra) ? StringMapWrapper.get(extra, 'validator') : null;
    var asyncValidator: AsyncValidatorFn =
        isPresent(extra) ? StringMapWrapper.get(extra, 'asyncValidator') : null;
    return new modelModule.ControlGroup(controls, optionals, validator, asyncValidator);
  }
  /**
   * Construct a new {@link Control} with the given `value`,`validator`, and `asyncValidator`.
   */
  control(value: Object, validator: ValidatorFn = null, asyncValidator: AsyncValidatorFn = null):
      modelModule.Control {
    return new modelModule.Control(value, validator, asyncValidator);
  }

  /**
   * Construct an array of {@link Control}s from the given `controlsConfig` array of
   * configuration, with the given optional `validator` and `asyncValidator`.
   */
  array(
      controlsConfig: any[], validator: ValidatorFn = null,
      asyncValidator: AsyncValidatorFn = null): modelModule.ControlArray {
    var controls = controlsConfig.map(c => this._createControl(c));
    return new modelModule.ControlArray(controls, validator, asyncValidator);
  }

  /** @internal */
  _reduceControls(controlsConfig: {[k: string]: any}):
      {[key: string]: modelModule.AbstractControl} {
    var controls: {[key: string]: modelModule.AbstractControl} = {};
    StringMapWrapper.forEach(controlsConfig, (controlConfig: any, controlName: string) => {
      controls[controlName] = this._createControl(controlConfig);
    });
    return controls;
  }

  /** @internal */
  _createControl(controlConfig: any): modelModule.AbstractControl {
    if (controlConfig instanceof modelModule.Control ||
        controlConfig instanceof modelModule.ControlGroup ||
        controlConfig instanceof modelModule.ControlArray) {
      return controlConfig;

    } else if (isArray(controlConfig)) {
      var value = controlConfig[0];
      var validator: ValidatorFn = controlConfig.length > 1 ? controlConfig[1] : null;
      var asyncValidator: AsyncValidatorFn = controlConfig.length > 2 ? controlConfig[2] : null;
      return this.control(value, validator, asyncValidator);

    } else {
      return this.control(controlConfig);
    }
  }
}
