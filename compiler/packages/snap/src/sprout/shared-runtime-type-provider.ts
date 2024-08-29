/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Effect, ValueKind} from 'babel-plugin-react-compiler/src';
import type {TypeConfig} from 'babel-plugin-react-compiler/src/HIR/TypeSchema';

export function makeSharedRuntimeTypeProvider({
  EffectEnum,
  ValueKindEnum,
}: {
  EffectEnum: typeof Effect;
  ValueKindEnum: typeof ValueKind;
}) {
  return function sharedRuntimeTypeProvider(
    moduleName: string,
  ): TypeConfig | null {
    if (moduleName !== 'shared-runtime') {
      return null;
    }
    return {
      kind: 'object',
      properties: {
        default: {
          kind: 'function',
          calleeEffect: EffectEnum.Read,
          positionalParams: [],
          restParam: EffectEnum.Read,
          returnType: {kind: 'type', name: 'Primitive'},
          returnValueKind: ValueKindEnum.Primitive,
        },
        typedArrayPush: {
          kind: 'function',
          calleeEffect: EffectEnum.Read,
          positionalParams: [EffectEnum.Store, EffectEnum.Capture],
          restParam: EffectEnum.Capture,
          returnType: {kind: 'type', name: 'Primitive'},
          returnValueKind: ValueKindEnum.Primitive,
        },
        typedLog: {
          kind: 'function',
          calleeEffect: EffectEnum.Read,
          positionalParams: [],
          restParam: EffectEnum.Read,
          returnType: {kind: 'type', name: 'Primitive'},
          returnValueKind: ValueKindEnum.Primitive,
        },
        useFreeze: {
          kind: 'hook',
          returnType: {kind: 'type', name: 'Any'},
        },
        useFragment: {
          kind: 'hook',
          returnType: {kind: 'type', name: 'MixedReadonly'},
          noAlias: true,
        },
        useNoAlias: {
          kind: 'hook',
          returnType: {kind: 'type', name: 'Any'},
          returnValueKind: ValueKindEnum.Mutable,
          noAlias: true,
        },
      },
    };
  };
}
