/**
 * To create a Pipe, you must implement this interface.
 *
 * Angular invokes the `transform` method with the value of a binding
 * as the first argument, and any parameters as the second argument in list form.
 *
 * ## Syntax
 *
 * `value | pipeName[:arg0[:arg1...]]`
 *
 * ### Example ([live demo](http://plnkr.co/edit/f5oyIked9M2cKzvZNKHV?p=preview))
 *
 * The `RepeatPipe` below repeats the value as many times as indicated by the first argument:
 *
 * ```
 * import {Pipe, PipeTransform} from '@angular/core';
 *
 * @Pipe({name: 'repeat'})
 * export class RepeatPipe implements PipeTransform {
 *   transform(value: any, times: number) {
 *     return value.repeat(times);
 *   }
 * }
 * ```
 *
 * Invoking `{{ 'ok' | repeat:3 }}` in a template produces `okokok`.
 *
 */
export interface PipeTransform { transform(value: any, ...args: any[]): any; }
