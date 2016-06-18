
import {COMMON_DIRECTIVES, FORM_DIRECTIVES as OLD_FORM_DIRECTIVES, FORM_PROVIDERS as OLD_FORM_PROVIDERS} from '@angular/common';
import {CompilerConfig} from '@angular/compiler';
import {PLATFORM_DIRECTIVES, PLATFORM_PIPES, Type} from '@angular/core';

import {FORM_DIRECTIVES as NEW_FORM_DIRECTIVES} from './directives';
import {RadioControlRegistry as NewRadioControlRegistry} from './directives/radio_control_value_accessor';
import {ListWrapper} from './facade/collection';
import {FormBuilder as NewFormBuilder} from './form_builder';



/*
 * Shorthand set of providers used for building Angular forms.
 *
 * ### Example
 *
 * ```typescript
 * bootstrap(MyApp, [FORM_PROVIDERS]);
 * ```
 *
 * @experimental
 */
export const FORM_PROVIDERS: Type[] = /*@ts2dart_const*/[NewFormBuilder, NewRadioControlRegistry];

function flatten(platformDirectives: any[]): any[] {
  let flattenedDirectives: any[] = [];
  platformDirectives.forEach((directives) => {
    if (Array.isArray(directives)) {
      flattenedDirectives = flattenedDirectives.concat(directives);
    } else {
      flattenedDirectives.push(directives);
    }
  });
  return flattenedDirectives;
}

export function disableDeprecatedForms(): any[] {
  return [{
    provide: CompilerConfig,
    useFactory: (platformDirectives: any[], platformPipes: any[]) => {
      const flattenedDirectives = flatten(platformDirectives);
      ListWrapper.remove(flattenedDirectives, OLD_FORM_DIRECTIVES);
      return new CompilerConfig({platformDirectives: flattenedDirectives, platformPipes});
    },
    deps: [PLATFORM_DIRECTIVES, PLATFORM_PIPES]
  }];
}

export function provideForms(): any[] {
  return [
    {provide: PLATFORM_DIRECTIVES, useValue: NEW_FORM_DIRECTIVES, multi: true}, FORM_PROVIDERS
  ];
}
