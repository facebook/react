import {Directive, Host, Inject, OnDestroy, OnInit, Optional, Self, SkipSelf, forwardRef} from '@angular/core';

import {ControlGroup} from '../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../validators';

import {ControlContainer} from './control_container';
import {Form} from './form_interface';
import {composeAsyncValidators, composeValidators, controlPath} from './shared';
import {AsyncValidatorFn, ValidatorFn} from './validators';

export const controlGroupProvider: any =
    /*@ts2dart_const*/ /* @ts2dart_Provider */ {
      provide: ControlContainer,
      useExisting: forwardRef(() => NgControlGroup)
    };

/**
 * Creates and binds a control group to a DOM element.
 *
 * This directive can only be used as a child of {@link NgForm} or {@link NgFormModel}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/7EJ11uGeaggViYM6T5nq?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'my-app',
 *   template: `
 *     <div>
 *       <h2>Angular Control &amp; ControlGroup Example</h2>
 *       <form #f="ngForm">
 *         <div ngControlGroup="name" #cgName="ngForm">
 *           <h3>Enter your name:</h3>
 *           <p>First: <input ngControl="first" required></p>
 *           <p>Middle: <input ngControl="middle"></p>
 *           <p>Last: <input ngControl="last" required></p>
 *         </div>
 *         <h3>Name value:</h3>
 *         <pre>{{valueOf(cgName)}}</pre>
 *         <p>Name is {{cgName?.control?.valid ? "valid" : "invalid"}}</p>
 *         <h3>What's your favorite food?</h3>
 *         <p><input ngControl="food"></p>
 *         <h3>Form value</h3>
 *         <pre>{{valueOf(f)}}</pre>
 *       </form>
 *     </div>
 *   `
 * })
 * export class App {
 *   valueOf(cg: NgControlGroup): string {
 *     if (cg.control == null) {
 *       return null;
 *     }
 *     return JSON.stringify(cg.control.value, null, 2);
 *   }
 * }
 * ```
 *
 * This example declares a control group for a user's name. The value and validation state of
 * this group can be accessed separately from the overall form.
 *
 * @experimental
 */
@Directive({
  selector: '[ngControlGroup]',
  providers: [controlGroupProvider],
  inputs: ['name: ngControlGroup'],
  exportAs: 'ngForm'
})
export class NgControlGroup extends ControlContainer implements OnInit,
    OnDestroy {
  /** @internal */
  _parent: ControlContainer;

  constructor(
      @Host() @SkipSelf() parent: ControlContainer,
      @Optional() @Self() @Inject(NG_VALIDATORS) private _validators: any[],
      @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) private _asyncValidators: any[]) {
    super();
    this._parent = parent;
  }

  ngOnInit(): void { this.formDirective.addControlGroup(this); }

  ngOnDestroy(): void { this.formDirective.removeControlGroup(this); }

  /**
   * Get the {@link ControlGroup} backing this binding.
   */
  get control(): ControlGroup { return this.formDirective.getControlGroup(this); }

  /**
   * Get the path to this control group.
   */
  get path(): string[] { return controlPath(this.name, this._parent); }

  /**
   * Get the {@link Form} to which this group belongs.
   */
  get formDirective(): Form { return this._parent.formDirective; }

  get validator(): ValidatorFn { return composeValidators(this._validators); }

  get asyncValidator(): AsyncValidatorFn { return composeAsyncValidators(this._asyncValidators); }
}
