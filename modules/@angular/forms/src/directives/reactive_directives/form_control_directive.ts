import {Directive, Inject, Input, OnChanges, Optional, Output, Self, SimpleChanges, forwardRef} from '@angular/core';

import {EventEmitter, ObservableWrapper} from '../../facade/async';
import {StringMapWrapper} from '../../facade/collection';
import {FormControl} from '../../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../../validators';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '../control_value_accessor';
import {NgControl} from '../ng_control';
import {composeAsyncValidators, composeValidators, isPropertyUpdated, selectValueAccessor, setUpControl} from '../shared';
import {AsyncValidatorFn, ValidatorFn} from '../validators';

export const formControlBinding: any =
    /*@ts2dart_const*/ /* @ts2dart_Provider */ {
      provide: NgControl,
      useExisting: forwardRef(() => FormControlDirective)
    };

/**
 * Binds an existing {@link FormControl} to a DOM element.
 **
 * In this example, we bind the control to an input element. When the value of the input element
 * changes, the value of the control will reflect that change. Likewise, if the value of the
 * control changes, the input element reflects that change.
 *
 *  ```typescript
 * @Component({
 *   selector: 'my-app',
 *   template: `
 *     <div>
 *       <h2>Bind existing control example</h2>
 *       <form>
 *         <p>Element with existing control: <input type="text"
 * [formControl]="loginControl"></p>
 *         <p>Value of existing control: {{loginControl.value}}</p>
 *       </form>
 *     </div>
 *   `,
 *   directives: [REACTIVE_FORM_DIRECTIVES]
 * })
 * export class App {
 *   loginControl: FormControl = new FormControl('');
 * }
 *  ```
 *
 * ### ngModel
 *
 * We can also use `ngModel` to bind a domain model to the form.
 **
 *  ```typescript
 * @Component({
 *      selector: "login-comp",
 *      directives: [FORM_DIRECTIVES],
 *      template: "<input type='text' [formControl]='loginControl' [(ngModel)]='login'>"
 *      })
 * class LoginComp {
 *  loginControl: FormControl = new FormControl('');
 *  login:string;
 * }
 *  ```
 *
 *  @experimental
 */
@Directive({selector: '[formControl]', providers: [formControlBinding], exportAs: 'ngForm'})

export class FormControlDirective extends NgControl implements OnChanges {
  viewModel: any;

  @Input('formControl') form: FormControl;
  @Input('ngModel') model: any;
  @Output('ngModelChange') update = new EventEmitter();

  constructor(@Optional() @Self() @Inject(NG_VALIDATORS) private _validators:
                  /* Array<Validator|Function> */ any[],
              @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) private _asyncValidators:
                  /* Array<Validator|Function> */ any[],
              @Optional() @Self() @Inject(NG_VALUE_ACCESSOR)
              valueAccessors: ControlValueAccessor[]) {
                super();
                this.valueAccessor = selectValueAccessor(this, valueAccessors);
              }

              ngOnChanges(changes: SimpleChanges): void {
                if (this._isControlChanged(changes)) {
                  setUpControl(this.form, this);
                  this.form.updateValueAndValidity({emitEvent: false});
                }
                if (isPropertyUpdated(changes, this.viewModel)) {
                  this.form.updateValue(this.model);
                  this.viewModel = this.model;
                }
              }

              get path(): string[] { return []; }

              get validator(): ValidatorFn { return composeValidators(this._validators); }

              get asyncValidator(): AsyncValidatorFn {
                return composeAsyncValidators(this._asyncValidators);
              }

              get control(): FormControl { return this.form; }

              viewToModelUpdate(newValue: any): void {
                this.viewModel = newValue;
                ObservableWrapper.callEmit(this.update, newValue);
              }

              private _isControlChanged(changes: {[key: string]: any}): boolean {
                return StringMapWrapper.contains(changes, 'form');
              }
}
