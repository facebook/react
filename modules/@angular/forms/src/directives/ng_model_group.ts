import {Directive, Host, Inject, Input, OnDestroy, OnInit, Optional, Self, SkipSelf, forwardRef} from '@angular/core';

import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../validators';

import {AbstractFormGroupDirective} from './abstract_form_group_directive';
import {ControlContainer} from './control_container';

export const modelGroupProvider: any =
    /*@ts2dart_const*/ /* @ts2dart_Provider */ {
      provide: ControlContainer,
      useExisting: forwardRef(() => NgModelGroup)
    };

/**
 * Creates and binds a model group to a DOM element.
 *
 * This directive can only be used as a child of {@link NgForm}.
 *
 * ```typescript
 * @Component({
 *   selector: 'my-app',
 *   template: `
 *     <div>
 *       <h2>Angular forms Example</h2>
 *       <form #f="ngForm">
 *         <div ngModelGroup="name" #mgName="ngModelGroup">
 *           <h3>Enter your name:</h3>
 *           <p>First: <input name="first" ngModel required></p>
 *           <p>Middle: <input name="middle" ngModel></p>
 *           <p>Last: <input name="last" ngModel required></p>
 *         </div>
 *         <h3>Name value:</h3>
 *         <pre>{{ mgName | json }}</pre>
 *         <p>Name is {{mgName?.valid ? "valid" : "invalid"}}</p>
 *         <h3>What's your favorite food?</h3>
 *         <p><input name="food" ngModel></p>
 *         <h3>Form value</h3>
 *         <pre>{{ f | json }}</pre>
 *       </form>
 *     </div>
 *   `
 * })
 * export class App {}
 * ```
 *
 * This example declares a model group for a user's name. The value and validation state of
 * this group can be accessed separately from the overall form.
 *
 * @experimental
 */
@Directive({selector: '[ngModelGroup]', providers: [modelGroupProvider], exportAs: 'ngModelGroup'})
export class NgModelGroup extends AbstractFormGroupDirective implements OnInit, OnDestroy {
  @Input('ngModelGroup') name: string;

  constructor(
      @Host() @SkipSelf() parent: ControlContainer,
      @Optional() @Self() @Inject(NG_VALIDATORS) validators: any[],
      @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: any[]) {
    super();
    this._parent = parent;
    this._validators = validators;
    this._asyncValidators = asyncValidators;
  }
}
