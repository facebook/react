import {Pipe, PipeTransform} from '@angular/core';
import {StringWrapper, isPresent, isStringMap} from '../facade/lang';
import {InvalidPipeArgumentException} from './invalid_pipe_argument_exception';

const _INTERPOLATION_REGEXP: RegExp = /#/g;

/**
 *
 *  Maps a value to a string that pluralizes the value properly.
 *
 *  ## Usage
 *
 *  expression | i18nPlural:mapping
 *
 *  where `expression` is a number and `mapping` is an object that indicates the proper text for
 *  when the `expression` evaluates to 0, 1, or some other number.  You can interpolate the actual
 *  value into the text using the `#` sign.
 *
 *  ## Example
 *
 *  ```
 *  <div>
 *    {{ messages.length | i18nPlural: messageMapping }}
 *  </div>
 *
 *  class MyApp {
 *    messages: any[];
 *    messageMapping: any = {
 *      '=0': 'No messages.',
 *      '=1': 'One message.',
 *      'other': '# messages.'
 *    }
 *    ...
 *  }
 *  ```
 *
 * @experimental
 */
@Pipe({name: 'i18nPlural', pure: true})
export class I18nPluralPipe implements PipeTransform {
  transform(value: number, pluralMap: {[count: string]: string}): string {
    var key: string;
    var valueStr: string;

    if (!isStringMap(pluralMap)) {
      throw new InvalidPipeArgumentException(I18nPluralPipe, pluralMap);
    }

    key = value === 0 || value === 1 ? `=${value}` : 'other';
    valueStr = isPresent(value) ? value.toString() : '';

    return StringWrapper.replaceAll(pluralMap[key], _INTERPOLATION_REGEXP, valueStr);
  }
}
