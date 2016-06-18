import {BaseException} from '../facade/exceptions';
import {Type, stringify} from '../facade/lang';

export class InvalidPipeArgumentException extends BaseException {
  constructor(type: Type, value: Object) {
    super(`Invalid argument '${value}' for pipe '${stringify(type)}'`);
  }
}
