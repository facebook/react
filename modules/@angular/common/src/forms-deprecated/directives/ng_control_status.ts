import {Directive, Self} from '@angular/core';

import {isPresent} from '../../facade/lang';

import {NgControl} from './ng_control';


/**
 * Directive automatically applied to Angular forms that sets CSS classes
 * based on control status (valid/invalid/dirty/etc).
 *
 * @experimental
 */
@Directive({
  selector: '[ngControl],[ngModel],[ngFormControl]',
  host: {
    '[class.ng-untouched]': 'ngClassUntouched',
    '[class.ng-touched]': 'ngClassTouched',
    '[class.ng-pristine]': 'ngClassPristine',
    '[class.ng-dirty]': 'ngClassDirty',
    '[class.ng-valid]': 'ngClassValid',
    '[class.ng-invalid]': 'ngClassInvalid'
  }
})
export class NgControlStatus {
  private _cd: NgControl;

  constructor(@Self() cd: NgControl) { this._cd = cd; }

  get ngClassUntouched(): boolean {
    return isPresent(this._cd.control) ? this._cd.control.untouched : false;
  }
  get ngClassTouched(): boolean {
    return isPresent(this._cd.control) ? this._cd.control.touched : false;
  }
  get ngClassPristine(): boolean {
    return isPresent(this._cd.control) ? this._cd.control.pristine : false;
  }
  get ngClassDirty(): boolean {
    return isPresent(this._cd.control) ? this._cd.control.dirty : false;
  }
  get ngClassValid(): boolean {
    return isPresent(this._cd.control) ? this._cd.control.valid : false;
  }
  get ngClassInvalid(): boolean {
    return isPresent(this._cd.control) ? !this._cd.control.valid : false;
  }
}
