import {Directive, Host, Inject, Input, OnChanges, OnDestroy, Optional, Output, Self, SimpleChanges, SkipSelf, forwardRef} from '@angular/core';

import {EventEmitter, ObservableWrapper} from '../../facade/async';
import {FormControl} from '../../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../../validators';

import {ControlContainer} from '../control_container';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '../control_value_accessor';
import {NgControl} from '../ng_control';
import {composeAsyncValidators, composeValidators, controlPath, isPropertyUpdated, selectValueAccessor} from '../shared';
import {AsyncValidatorFn, ValidatorFn} from '../validators';


export const controlNameBinding: any =
    /*@ts2dart_const*/ /* @ts2dart_Provider */ {
      provide: NgControl,
      useExisting: forwardRef(() => FormControlName)
    };

/**
 * Syncs an existing form control with the specified name to a DOM element.
 *
 * This directive can only be used as a child of {@link FormGroupDirective}.

 * ### Example
 *
 * In this example, we create the login and password controls.
 * We can work with each control separately: check its validity, get its value, listen to its
 * changes.
 *
 *  ```
 * @Component({
 *      selector: "login-comp",
 *      directives: [REACTIVE_FORM_DIRECTIVES],
 *      template: `
 *        <form [formGroup]="myForm" (submit)="onLogIn()">
 *          Login <input type="text" formControlName="login">
 *          <div *ngIf="!loginCtrl.valid">Login is invalid</div>
 *          Password <input type="password" formControlName="password">
 *          <button type="submit">Log in!</button>
 *        </form>
 *      `})
 * class LoginComp {
 *  loginCtrl = new Control();
 *  passwordCtrl = new Control();
 *  myForm = new FormGroup({
 *     login: loginCtrl,
 *     password: passwordCtrl
 *  });
 *  onLogIn(): void {
 *    // value === {login: 'some login', password: 'some password'}
 *  }
 * }
 *  ```
 *
 * TODO(kara): Remove ngModel example with reactive paradigm
 * We can also use ngModel to bind a domain model to the form, if you don't want to provide
 * individual init values to each control.
 *
 *  ```
 * @Component({
 *      selector: "login-comp",
 *      directives: [REACTIVE_FORM_DIRECTIVES],
 *      template: `
 *        <form [formGroup]="myForm" (submit)='onLogIn()'>
 *          Login <input type='text' formControlName='login' [(ngModel)]="credentials.login">
 *          Password <input type='password' formControlName='password'
 *                          [(ngModel)]="credentials.password">
 *          <button type='submit'>Log in!</button>
 *        </form>
 *      `})
 * class LoginComp {
 *  credentials: {login:string, password:string};
 *  myForm = new FormGroup({
 *    login: new Control(this.credentials.login),
 *    password: new Control(this.credentials.password)
 *  });
 *
 *  onLogIn(): void {
 *    // this.credentials.login === "some login"
 *    // this.credentials.password === "some password"
 *  }
 * }
 *  ```
 *
 *  @experimental
 */
@Directive({selector: '[formControlName]', providers: [controlNameBinding]})
export class FormControlName extends NgControl implements OnChanges, OnDestroy {
  /** @internal */
  viewModel: any;
  private _added = false;

  @Input('formControlName') name: string;

  // TODO(kara):  Replace ngModel with reactive API
  @Input('ngModel') model: any;
  @Output('ngModelChange') update = new EventEmitter();

  constructor(@Host() @SkipSelf() private _parent: ControlContainer,
              @Optional() @Self() @Inject(NG_VALIDATORS) private _validators:
                  /* Array<Validator|Function> */ any[],
              @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) private _asyncValidators:
                  /* Array<Validator|Function> */ any[],
              @Optional() @Self() @Inject(NG_VALUE_ACCESSOR)
              valueAccessors: ControlValueAccessor[]) {
                super();
                this.valueAccessor = selectValueAccessor(this, valueAccessors);
              }

              ngOnChanges(changes: SimpleChanges) {
                if (!this._added) {
                  this.formDirective.addControl(this);
                  this._added = true;
                }
                if (isPropertyUpdated(changes, this.viewModel)) {
                  this.viewModel = this.model;
                  this.formDirective.updateModel(this, this.model);
                }
              }

              ngOnDestroy(): void { this.formDirective.removeControl(this); }

              viewToModelUpdate(newValue: any): void {
                this.viewModel = newValue;
                ObservableWrapper.callEmit(this.update, newValue);
              }

              get path(): string[] { return controlPath(this.name, this._parent); }

              get formDirective(): any { return this._parent.formDirective; }

              get validator(): ValidatorFn { return composeValidators(this._validators); }

              get asyncValidator(): AsyncValidatorFn {
                return composeAsyncValidators(this._asyncValidators);
              }

              get control(): FormControl { return this.formDirective.getControl(this); }
}
