import {AbstractControl} from '../model';

import {AsyncValidatorFn, Validator, ValidatorFn} from './validators';

export function normalizeValidator(validator: ValidatorFn | Validator): ValidatorFn {
  if ((<Validator>validator).validate !== undefined) {
    return (c: AbstractControl) => (<Validator>validator).validate(c);
  } else {
    return <ValidatorFn>validator;
  }
}

export function normalizeAsyncValidator(validator: AsyncValidatorFn | Validator): AsyncValidatorFn {
  if ((<Validator>validator).validate !== undefined) {
    return (c: AbstractControl) => Promise.resolve((<Validator>validator).validate(c));
  } else {
    return <AsyncValidatorFn>validator;
  }
}
