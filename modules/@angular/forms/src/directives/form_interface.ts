import {FormControl, FormGroup} from '../model';

import {AbstractFormGroupDirective} from './abstract_form_group_directive';
import {NgControl} from './ng_control';



/**
 * An interface that {@link FormGroupDirective} and {@link NgForm} implement.
 *
 * Only used by the forms module.
 *
 * @experimental
 */
export interface Form {
  /**
   * Add a control to this form.
   */
  addControl(dir: NgControl): FormControl;

  /**
   * Remove a control from this form.
   */
  removeControl(dir: NgControl): void;

  /**
   * Look up the {@link FormControl} associated with a particular {@link NgControl}.
   */
  getControl(dir: NgControl): FormControl;

  /**
   * Add a group of controls to this form.
   */
  addFormGroup(dir: AbstractFormGroupDirective): void;

  /**
   * Remove a group of controls from this form.
   */
  removeFormGroup(dir: AbstractFormGroupDirective): void;

  /**
   * Look up the {@link FormGroup} associated with a particular {@link AbstractFormGroupDirective}.
   */
  getFormGroup(dir: AbstractFormGroupDirective): FormGroup;

  /**
   * Update the model for a particular control with a new value.
   */
  updateModel(dir: NgControl, value: any): void;
}
