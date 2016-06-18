import {Directive, Inject, OnChanges, Optional, Self, SimpleChanges, forwardRef} from '@angular/core';

import {EventEmitter, ObservableWrapper} from '../../facade/async';
import {ListWrapper, StringMapWrapper} from '../../facade/collection';
import {BaseException} from '../../facade/exceptions';
import {isBlank} from '../../facade/lang';
import {Control, ControlGroup} from '../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS, Validators} from '../validators';

import {ControlContainer} from './control_container';
import {Form} from './form_interface';
import {NgControl} from './ng_control';
import {NgControlGroup} from './ng_control_group';
import {composeAsyncValidators, composeValidators, setUpControl, setUpControlGroup} from './shared';

export const formDirectiveProvider: any =
    /*@ts2dart_const*/ /* @ts2dart_Provider */ {
      provide: ControlContainer,
      useExisting: forwardRef(() => NgFormModel)
    };

let _formModelWarningDisplayed: boolean = false;

/**
 * Binds an existing control group to a DOM element.
 *
 * ### Example ([live demo](http://plnkr.co/edit/jqrVirudY8anJxTMUjTP?p=preview))
 *
 * In this example, we bind the control group to the form element, and we bind the login and
 * password controls to the login and password elements.
 *
 *  ```typescript
 * @Component({
 *   selector: 'my-app',
 *   template: `
 *     <div>
 *       <h2>NgFormModel Example</h2>
 *       <form [ngFormModel]="loginForm">
 *         <p>Login: <input type="text" ngControl="login"></p>
 *         <p>Password: <input type="password" ngControl="password"></p>
 *       </form>
 *       <p>Value:</p>
 *       <pre>{{value}}</pre>
 *     </div>
 *   `,
 *   directives: [FORM_DIRECTIVES]
 * })
 * export class App {
 *   loginForm: ControlGroup;
 *
 *   constructor() {
 *     this.loginForm = new ControlGroup({
 *       login: new Control(""),
 *       password: new Control("")
 *     });
 *   }
 *
 *   get value(): string {
 *     return JSON.stringify(this.loginForm.value, null, 2);
 *   }
 * }
 *  ```
 *
 * We can also use ngModel to bind a domain model to the form.
 *
 *  ```typescript
 * @Component({
 *      selector: "login-comp",
 *      directives: [FORM_DIRECTIVES],
 *      template: `
 *        <form [ngFormModel]='loginForm'>
 *          Login <input type='text' ngControl='login' [(ngModel)]='credentials.login'>
 *          Password <input type='password' ngControl='password'
 *                          [(ngModel)]='credentials.password'>
 *          <button (click)="onLogin()">Login</button>
 *        </form>`
 *      })
 * class LoginComp {
 *  credentials: {login: string, password: string};
 *  loginForm: ControlGroup;
 *
 *  constructor() {
 *    this.loginForm = new ControlGroup({
 *      login: new Control(""),
 *      password: new Control("")
 *    });
 *  }
 *
 *  onLogin(): void {
 *    // this.credentials.login === 'some login'
 *    // this.credentials.password === 'some password'
 *  }
 * }
 *  ```
 *
 *  @experimental
 */

@Directive({
  selector: '[ngFormModel]',
  providers: [formDirectiveProvider],
  inputs: ['form: ngFormModel'],
  host: {'(submit)': 'onSubmit()'},
  outputs: ['ngSubmit'],
  exportAs: 'ngForm'
})
export class NgFormModel extends ControlContainer implements Form,
    OnChanges {
  private _submitted: boolean = false;

  form: ControlGroup = null;
  directives: NgControl[] = [];
  ngSubmit = new EventEmitter();

  constructor(
      @Optional() @Self() @Inject(NG_VALIDATORS) private _validators: any[],
      @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) private _asyncValidators: any[]) {
    super();
    this._displayWarning();
  }

  private _displayWarning() {
    // TODO(kara): Update this when the new forms module becomes the default
    if (!_formModelWarningDisplayed) {
      _formModelWarningDisplayed = true;
      console.warn(`
      *It looks like you're using the old forms module. This will be opt-in in the next RC, and
      will eventually be removed in favor of the new forms module. For more information, see:
      https://docs.google.com/document/u/1/d/1RIezQqE4aEhBRmArIAS1mRIZtWFf6JxN_7B4meyWK0Y/pub
    `);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._checkFormPresent();
    if (StringMapWrapper.contains(changes, 'form')) {
      var sync = composeValidators(this._validators);
      this.form.validator = Validators.compose([this.form.validator, sync]);

      var async = composeAsyncValidators(this._asyncValidators);
      this.form.asyncValidator = Validators.composeAsync([this.form.asyncValidator, async]);

      this.form.updateValueAndValidity({onlySelf: true, emitEvent: false});
    }

    this._updateDomValue();
  }

  get submitted(): boolean { return this._submitted; }

  get formDirective(): Form { return this; }

  get control(): ControlGroup { return this.form; }

  get path(): string[] { return []; }

  addControl(dir: NgControl): void {
    var ctrl: any = this.form.find(dir.path);
    setUpControl(ctrl, dir);
    ctrl.updateValueAndValidity({emitEvent: false});
    this.directives.push(dir);
  }

  getControl(dir: NgControl): Control { return <Control>this.form.find(dir.path); }

  removeControl(dir: NgControl): void { ListWrapper.remove(this.directives, dir); }

  addControlGroup(dir: NgControlGroup) {
    var ctrl: any = this.form.find(dir.path);
    setUpControlGroup(ctrl, dir);
    ctrl.updateValueAndValidity({emitEvent: false});
  }

  removeControlGroup(dir: NgControlGroup) {}

  getControlGroup(dir: NgControlGroup): ControlGroup {
    return <ControlGroup>this.form.find(dir.path);
  }

  updateModel(dir: NgControl, value: any): void {
    var ctrl  = <Control>this.form.find(dir.path);
    ctrl.updateValue(value);
  }

  onSubmit(): boolean {
    this._submitted = true;
    ObservableWrapper.callEmit(this.ngSubmit, null);
    return false;
  }

  /** @internal */
  _updateDomValue() {
    this.directives.forEach(dir => {
      var ctrl: any = this.form.find(dir.path);
      dir.valueAccessor.writeValue(ctrl.value);
    });
  }

  private _checkFormPresent() {
    if (isBlank(this.form)) {
      throw new BaseException(
          `ngFormModel expects a form. Please pass one in. Example: <form [ngFormModel]="myCoolForm">`);
    }
  }
}
