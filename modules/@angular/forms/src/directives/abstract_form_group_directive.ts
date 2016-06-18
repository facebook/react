import {OnDestroy, OnInit} from '@angular/core';

import {FormGroup} from '../model';

import {ControlContainer} from './control_container';
import {Form} from './form_interface';
import {composeAsyncValidators, composeValidators, controlPath} from './shared';
import {AsyncValidatorFn, ValidatorFn} from './validators';

/**
  This is a base class for code shared between {@link NgModelGroup} and {@link FormGroupName}.
 */

export class AbstractFormGroupDirective extends ControlContainer implements OnInit, OnDestroy {
  /** @internal */
  _parent: ControlContainer;

  /** @internal */
  _validators: any[];

  /** @internal */
  _asyncValidators: any[];

  ngOnInit(): void { this.formDirective.addFormGroup(this); }

  ngOnDestroy(): void { this.formDirective.removeFormGroup(this); }

  /**
   * Get the {@link FormGroup} backing this binding.
   */
  get control(): FormGroup { return this.formDirective.getFormGroup(this); }

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
