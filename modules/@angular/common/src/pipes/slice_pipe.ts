import {Pipe, PipeTransform} from '@angular/core';
import {ListWrapper} from '../facade/collection';
import {StringWrapper, isArray, isBlank, isString} from '../facade/lang';
import {InvalidPipeArgumentException} from './invalid_pipe_argument_exception';

/**
 * Creates a new List or String containing only a subset (slice) of the
 * elements.
 *
 * The starting index of the subset to return is specified by the `start` parameter.
 *
 * The ending index of the subset to return is specified by the optional `end` parameter.
 *
 * ### Usage
 *
 *     expression | slice:start[:end]
 *
 * All behavior is based on the expected behavior of the JavaScript API
 * Array.prototype.slice() and String.prototype.slice()
 *
 * Where the input expression is a [List] or [String], and `start` is:
 *
 * - **a positive integer**: return the item at _start_ index and all items after
 * in the list or string expression.
 * - **a negative integer**: return the item at _start_ index from the end and all items after
 * in the list or string expression.
 * - **`|start|` greater than the size of the expression**: return an empty list or string.
 * - **`|start|` negative greater than the size of the expression**: return entire list or
 * string expression.
 *
 * and where `end` is:
 *
 * - **omitted**: return all items until the end of the input
 * - **a positive integer**: return all items before _end_ index of the list or string
 * expression.
 * - **a negative integer**: return all items before _end_ index from the end of the list
 * or string expression.
 *
 * When operating on a [List], the returned list is always a copy even when all
 * the elements are being returned.
 *
 * When operating on a blank value, returns it.
 *
 * ## List Example
 *
 * This `ngFor` example:
 *
 * {@example core/pipes/ts/slice_pipe/slice_pipe_example.ts region='SlicePipe_list'}
 *
 * produces the following:
 *
 *     <li>b</li>
 *     <li>c</li>
 *
 * ## String Examples
 *
 * {@example core/pipes/ts/slice_pipe/slice_pipe_example.ts region='SlicePipe_string'}
 *
 * @stable
 */

@Pipe({name: 'slice', pure: false})
export class SlicePipe implements PipeTransform {
  transform(value: any, start: number, end: number = null): any {
    if (isBlank(value)) return value;
    if (!this.supports(value)) {
      throw new InvalidPipeArgumentException(SlicePipe, value);
    }
    if (isString(value)) {
      return StringWrapper.slice(value, start, end);
    }
    return ListWrapper.slice(value, start, end);
  }

  private supports(obj: any): boolean { return isString(obj) || isArray(obj); }
}
