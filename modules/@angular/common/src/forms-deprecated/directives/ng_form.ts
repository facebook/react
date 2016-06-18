import {Directive, Inject, Optional, Self, forwardRef} from '@angular/core';

import {EventEmitter, ObservableWrapper, PromiseWrapper} from '../../facade/async';
import {ListWrapper} from '../../facade/collection';
import {isPresent} from '../../facade/lang';
import {AbstractControl, Control, ControlGroup} from '../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../validators';

import {ControlContainer} from './control_container';
import {Form} from './form_interface';
import {NgControl} from './ng_control';
import {NgControlGroup} from './ng_control_group';
import {composeAsyncValidators, composeValidators, setUpControl, setUpControlGroup} from './shared';

export const formDirectiveProvider: any =
    /*@ts2dart_const*/ {provide: ControlContainer, useExisting: forwardRef(() => NgForm)};

let _formWarningDisplayed: boolean = false;

/**
 * If `NgForm` is bound in a component, `<form>` elements in that component will be
 * upgraded to use the Angular form system.
 *
 * ### Typical Use
 *
 * Include `FORM_DIRECTIVES` in the `directives` section of a {@link View} annotation
 * to use `NgForm` and its associated controls.
 *
 * ### Structure
 *
 * An Angular form is a collection of `Control`s in some hierarchy.
 * `Control`s can be at the top level or can be organized in `ControlGroup`s
 * or `ControlArray`s. This hierarchy is reflected in the form's `value`, a
 * JSON object that mirrors the form structure.
 *
 * ### Submission
 *
 * The `ngSubmit` event signals when the user triggers a form submission.
 *
 * ### Example ([live demo](http://plnkr.co/edit/ltdgYj4P0iY64AR71EpL?p=preview))
 *
 *  ```typescript
 * @Component({
 *   selector: 'my-app',
 *   template: `
 *     <div>
 *       <p>Submit the form to see the data object Angular builds</p>
 *       <h2>NgForm demo</h2>
 *       <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
 *         <h3>Control group: credentials</h3>
 *         <div ngControlGroup="credentials">
 *           <p>Login: <input type="text" ngControl="login"></p>
 *           <p>Password: <input type="password" ngControl="password"></p>
 *         </div>
 *         <h3>Control group: person</h3>
 *         <div ngControlGroup="person">
 *           <p>First name: <input type="text" ngControl="firstName"></p>
 *           <p>Last name: <input type="text" ngControl="lastName"></p>
 *         </div>
 *         <button type="submit">Submit Form</button>
 *       <p>Form data submitted:</p>
 *       </form>
 *       <pre>{{data}}</pre>
 *     </div>
 * `,
 *   directives: [CORE_DIRECTIVES, FORM_DIRECTIVES]
 * })
 * export class App {
 *   constructor() {}
 *
 *   data: string;
 *
 *   onSubmit(data) {
 *     this.data = JSON.stringify(data, null, 2);
 *   }
 * }
 *  ```
 *
 *  @experimental
 */

@Directive({
  selector: 'form:not([ngNoForm]):not([ngFormModel]),ngForm,[ngForm]',
  providers: [formDirectiveProvider],
  host: {
    '(submit)': 'onSubmit()',
  },
  outputs: ['ngSubmit'],
  exportAs: 'ngForm'
})
export class NgForm extends ControlContainer implements Form {
  private _submitted: boolean = false;

  form: ControlGroup;
  ngSubmit = new EventEmitter();

  constructor(
      @Optional() @Self() @Inject(NG_VALIDATORS) validators: any[],
      @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: any[]) {
    super();
    this._displayWarning();
    this.form = new ControlGroup(
        {}, null, composeValidators(validators), composeAsyncValidators(asyncValidators));
  }

  private _displayWarning() {
    // TODO(kara): Update this when the new forms module becomes the default
    if (!_formWarningDisplayed) {
      _formWarningDisplayed = true;
      console.warn(`
      *It looks like you're using the old forms module. This will be opt-in in the next RC, and
      will eventually be removed in favor of the new forms module. For more information, see:
      https://docs.google.com/document/u/1/d/1RIezQqE4aEhBRmArIAS1mRIZtWFf6JxN_7B4meyWK0Y/pub
    `);
    }
  }

  get submitted(): boolean { return this._submitted; }

  get formDirective(): Form { return this; }

  get control(): ControlGroup { return this.form; }

  get path(): string[] { return []; }

  get controls(): {[key: string]: AbstractControl} { return this.form.controls; }

  addControl(dir: NgControl): void {
    PromiseWrapper.scheduleMicrotask(() => {
      var container = this._findContainer(dir.path);
      var ctrl = new Control();
      setUpControl(ctrl, dir);
      container.registerControl(dir.name, ctrl);
      ctrl.updateValueAndValidity({emitEvent: false});
    });
  }

  getControl(dir: NgControl): Control { return <Control>this.form.find(dir.path); }

  removeControl(dir: NgControl): void {
    PromiseWrapper.scheduleMicrotask(() => {
      var container = this._findContainer(dir.path);
      if (isPresent(container)) {
        container.removeControl(dir.name);
      }
    });
  }

  addControlGroup(dir: NgControlGroup): void {
    PromiseWrapper.scheduleMicrotask(() => {
      var container = this._findContainer(dir.path);
      var group = new ControlGroup({});
      setUpControlGroup(group, dir);
      container.registerControl(dir.name, group);
      group.updateValueAndValidity({emitEvent: false});
    });
  }

  removeControlGroup(dir: NgControlGroup): void {
    PromiseWrapper.scheduleMicrotask(() => {
      var container = this._findContainer(dir.path);
      if (isPresent(container)) {
        container.removeControl(dir.name);
      }
    });
  }

  getControlGroup(dir: NgControlGroup): ControlGroup {
    return <ControlGroup>this.form.find(dir.path);
  }

  updateModel(dir: NgControl, value: any): void {
    PromiseWrapper.scheduleMicrotask(() => {
      var ctrl = <Control>this.form.find(dir.path);
      ctrl.updateValue(value);
    });
  }

  onSubmit(): boolean {
    this._submitted = true;
    ObservableWrapper.callEmit(this.ngSubmit, null);
    return false;
  }

  /** @internal */
  _findContainer(path: string[]): ControlGroup {
    path.pop();
    return ListWrapper.isEmpty(path) ? this.form : <ControlGroup>this.form.find(path);
  }
}
