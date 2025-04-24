/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type AutoDepsDecorationsEvent} from 'babel-plugin-react-compiler/src/Entrypoint';
import {type Position} from 'vscode-languageserver-textdocument';
import {RequestType} from 'vscode-languageserver/node';
import {type Range, sourceLocationToRange} from '../utils/range';

export type AutoDepsDecorationsLSPEvent = {
  useEffectCallExpr: Range;
  decorations: Array<Range>;
};
export interface AutoDepsDecorationsParams {
  position: Position;
}
export namespace AutoDepsDecorationsRequest {
  export const type = new RequestType<
    AutoDepsDecorationsParams,
    AutoDepsDecorationsLSPEvent,
    void
  >('react/autodeps_decorations');
}

export function mapCompilerEventToLSPEvent(
  event: AutoDepsDecorationsEvent,
): AutoDepsDecorationsLSPEvent {
  return {
    useEffectCallExpr: sourceLocationToRange(event.fnLoc),
    decorations: event.decorations.map(sourceLocationToRange),
  };
}
