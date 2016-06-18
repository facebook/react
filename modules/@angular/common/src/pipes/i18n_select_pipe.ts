import {Pipe, PipeTransform} from '@angular/core';
import {StringMapWrapper} from '../facade/collection';
import {isStringMap} from '../facade/lang';
import {InvalidPipeArgumentException} from './invalid_pipe_argument_exception';


/**
 *
 *  Generic selector that displays the string that matches the current value.
 *
 *  ## Usage
 *
 *  expression | i18nSelect:mapping
 *
 *  where `mapping` is an object that indicates the text that should be displayed
 *  for different values of the provided `expression`.
 *
 *  ## Example
 *
 *  ```
 *  <div>
 *    {{ gender | i18nSelect: inviteMap }}
 *  </div>
 *
 *  class MyApp {
 *    gender: string = 'male';
 *    inviteMap: any = {
 *      'male': 'Invite her.',
 *      'female': 'Invite him.',
 *      'other': 'Invite them.'
 *    }
 *    ...
 *  }
 *  ```
 *
 *  @experimental
 */
@Pipe({name: 'i18nSelect', pure: true})
export class I18nSelectPipe implements PipeTransform {
  transform(value: string, mapping: {[key: string]: string}): string {
    if (!isStringMap(mapping)) {
      throw new InvalidPipeArgumentException(I18nSelectPipe, mapping);
    }

    return StringMapWrapper.contains(mapping, value) ? mapping[value] : mapping['other'];
  }
}
