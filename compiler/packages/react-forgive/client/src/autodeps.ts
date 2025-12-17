/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import {
  LanguageClient,
  RequestType,
  type Position,
} from 'vscode-languageclient/node';
import {positionLiteralToVSCodePosition, positionsToRange} from './mapping';

export type AutoDepsDecorationsLSPEvent = {
  useEffectCallExpr: [Position, Position];
  decorations: Array<[Position, Position]>;
};

export interface AutoDepsDecorationsParams {
  position: Position;
}

export namespace AutoDepsDecorationsRequest {
  export const type = new RequestType<
    AutoDepsDecorationsParams,
    AutoDepsDecorationsLSPEvent | null,
    void
  >('react/autodeps_decorations');
}

const inferredEffectDepDecoration =
  vscode.window.createTextEditorDecorationType({
    // TODO: make configurable?
    borderColor: new vscode.ThemeColor('diffEditor.move.border'),
    borderStyle: 'solid',
    borderWidth: '0 0 4px 0',
  });

let currentlyDecoratedAutoDepFnLoc: vscode.Range | null = null;
export function getCurrentlyDecoratedAutoDepFnLoc(): vscode.Range | null {
  return currentlyDecoratedAutoDepFnLoc;
}
export function setCurrentlyDecoratedAutoDepFnLoc(range: vscode.Range): void {
  currentlyDecoratedAutoDepFnLoc = range;
}
export function clearCurrentlyDecoratedAutoDepFnLoc(): void {
  currentlyDecoratedAutoDepFnLoc = null;
}

let decorationRequestId = 0;
export type AutoDepsDecorationsOptions = {
  shouldUpdateCurrent: boolean;
};
export function requestAutoDepsDecorations(
  client: LanguageClient,
  position: vscode.Position,
  options: AutoDepsDecorationsOptions,
) {
  const id = ++decorationRequestId;
  client
    .sendRequest(AutoDepsDecorationsRequest.type, {position})
    .then(response => {
      if (response !== null) {
        const {
          decorations,
          useEffectCallExpr: [start, end],
        } = response;
        // Maintain ordering
        if (decorationRequestId === id) {
          if (options.shouldUpdateCurrent) {
            setCurrentlyDecoratedAutoDepFnLoc(positionsToRange(start, end));
          }
          drawInferredEffectDepDecorations(decorations);
        }
      } else {
        clearCurrentlyDecoratedAutoDepFnLoc();
        clearDecorations(inferredEffectDepDecoration);
      }
    });
}

export function drawInferredEffectDepDecorations(
  decorations: Array<[Position, Position]>,
): void {
  const decorationOptions = decorations.map(([start, end]) => {
    return {
      range: new vscode.Range(
        positionLiteralToVSCodePosition(start),
        positionLiteralToVSCodePosition(end),
      ),
      hoverMessage: 'Inferred as an effect dependency',
    };
  });
  vscode.window.activeTextEditor?.setDecorations(
    inferredEffectDepDecoration,
    decorationOptions,
  );
}

export function clearDecorations(
  decorationType: vscode.TextEditorDecorationType,
) {
  vscode.window.activeTextEditor?.setDecorations(decorationType, []);
}
