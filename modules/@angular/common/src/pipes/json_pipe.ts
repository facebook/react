import {Pipe, PipeTransform} from '@angular/core';

import {Json} from '../facade/lang';



/**
 * Transforms any input value using `JSON.stringify`. Useful for debugging.
 *
 * ### Example
 * {@example core/pipes/ts/json_pipe/json_pipe_example.ts region='JsonPipe'}
 *
 * @stable
 */
@Pipe({name: 'json', pure: false})
export class JsonPipe implements PipeTransform {
  transform(value: any): string { return Json.stringify(value); }
}
