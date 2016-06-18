/**
 * @module
 * @description
 * This module provides a set of common Pipes.
 */
import {AsyncPipe} from './async_pipe';
import {DatePipe} from './date_pipe';
import {I18nPluralPipe} from './i18n_plural_pipe';
import {I18nSelectPipe} from './i18n_select_pipe';
import {JsonPipe} from './json_pipe';
import {LowerCasePipe} from './lowercase_pipe';
import {CurrencyPipe, DecimalPipe, PercentPipe} from './number_pipe';
import {ReplacePipe} from './replace_pipe';
import {SlicePipe} from './slice_pipe';
import {UpperCasePipe} from './uppercase_pipe';


/**
 * A collection of Angular core pipes that are likely to be used in each and every
 * application.
 *
 * This collection can be used to quickly enumerate all the built-in pipes in the `pipes`
 * property of the `@Component` decorator.
 *
 * @experimental Contains i18n pipes which are experimental
 */
export const COMMON_PIPES = /*@ts2dart_const*/[
  AsyncPipe,
  UpperCasePipe,
  LowerCasePipe,
  JsonPipe,
  SlicePipe,
  DecimalPipe,
  PercentPipe,
  CurrencyPipe,
  DatePipe,
  ReplacePipe,
  I18nPluralPipe,
  I18nSelectPipe,
];
