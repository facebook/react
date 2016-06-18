import {Type} from '../src/facade/lang';

import {PLATFORM_CORE_PROVIDERS} from './application_ref';
import {Console} from './console';
import {Provider} from './di';
import {Reflector, reflector} from './reflection/reflection';
import {ReflectorReader} from './reflection/reflector_reader';
import {TestabilityRegistry} from './testability/testability';

function _reflector(): Reflector {
  return reflector;
}

var __unused: Type;  // prevent missing use Dart warning.

/**
 * A default set of providers which should be included in any Angular platform.
 * @experimental
 */
export const PLATFORM_COMMON_PROVIDERS: Array<any|Type|Provider|any[]> = /*@ts2dart_const*/[
  PLATFORM_CORE_PROVIDERS,
  /*@ts2dart_Provider*/ {provide: Reflector, useFactory: _reflector, deps: []},
  /*@ts2dart_Provider*/ {provide: ReflectorReader, useExisting: Reflector}, TestabilityRegistry,
  Console
];
