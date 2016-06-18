import {Directive, Inject, OnChanges, Optional, Self, SimpleChanges, forwardRef} from '@angular/core';

import {EventEmitter, ObservableWrapper} from '../../facade/async';
import {Control} from '../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../validators';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from './control_value_accessor';
import {NgControl} from './ng_control';
import {composeAsyncValidators, composeValidators, isPropertyUpdated, selectValueAccessor, setUpControl} from './shared';
import {AsyncValidatorFn, ValidatorFn} from './validators';

export const formControlBinding: any =
    /*@ts2dart_const*/ /* @ts2dart_Provider */ {
      provide: NgControl,
      useExisting: forwardRef(() => NgModel)
    };

/**
 * Binds a domain model to a form control.
 *
 * ### Usage
 *
 * `ngModel` binds an existing domain model to a form control. For a
 * two-way binding, use `[(ngModel)]` to ensure the model updates in
 * both directions.
 *
 * ### Example ([live demo](http://plnkr.co/edit/R3UX5qDaUqFO2VYR0UzH?p=preview))
 *  ```typescript
 * @Component({
 *      selector: "search-comp",
 *      directives: [FORM_DIRECTIVES],
 *      template: `<input type='text' [(ngModel)]="searchQuery">`
 *      })
 * class SearchComp {
 *  searchQuery: string;
 * }
 *  ```
 *
 *  @experimental
 */
@Directive({
  selector: '[ngModel]:not([ngControl]):not([ngFormControl])',
  providers: [formControlBinding],
  inputs: ['model: ngModel'],
  outputs: ['update: ngModelChange'],
  exportAs: 'ngForm'
})
export class NgModel extends NgControl implements OnChanges {
  /** @internal */
  _control = new Control();
  /** @internal */
  _added = false;
  update = new EventEmitter();
  model: any;
  viewModel: any;

  constructor(@Optional() @Self() @Inject(NG_VALIDATORS) private _validators: any[],
              @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) private _asyncValidators: any[],
              @Optional() @Self() @Inject(NG_VALUE_ACCESSOR)
              valueAccessors: ControlValueAccessor[]) {
                super();
                this.valueAccessor = selectValueAccessor(this, valueAccessors);
              }

              ngOnChanges(changes: SimpleChanges) {
                if (!this._added) {
                  setUpControl(this._control, this);
                  this._control.updateValueAndValidity({emitEvent: false});
                  this._added = true;
                }

                if (isPropertyUpdated(changes, this.viewModel)) {
                  this._control.updateValue(this.model);
                  this.viewModel = this.model;
                }
              }

              get control(): Control { return this._control; }

              get path(): string[] { return []; }

              get validator(): ValidatorFn { return composeValidators(this._validators); }

              get asyncValidator(): AsyncValidatorFn {
                return composeAsyncValidators(this._asyncValidators);
              }

              viewToModelUpdate(newValue: any): void {
                this.viewModel = newValue;
                ObservableWrapper.callEmit(this.update, newValue);
              }
}
