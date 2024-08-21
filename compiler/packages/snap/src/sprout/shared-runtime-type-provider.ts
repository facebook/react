/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type TypeConfig} from 'babel-plugin-react-compiler/src/HIR/TypeSchema';

export function sharedRuntimeTypeProvider(
  moduleName: string,
): TypeConfig | null {
  if (moduleName !== './shared-runtime') {
    return null;
  }
  return {
    kind: 'object',
    properties: {
      typedArrayPush: {
        kind: 'function',
        calleeEffect: 'read',
        positionalParams: ['store', 'capture'],
        restParam: 'capture',
        returnType: {kind: 'type', name: 'Primitive'},
        returnValueKind: 'primitive',
      },
      typedLog: {
        kind: 'function',
        calleeEffect: 'read',
        positionalParams: [],
        restParam: 'read',
        returnType: {kind: 'type', name: 'Primitive'},
        returnValueKind: 'primitive',
      },
    },
  };
}
