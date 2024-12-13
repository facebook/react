/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Monaco } from '@monaco-editor/react';
import { CompilerErrorDetail, ErrorSeverity } from 'babel-plugin-react-compiler/src';
import { MarkerSeverity, editor } from 'monaco-editor';

function mapReactCompilerSeverityToMonaco(level: ErrorSeverity, monaco: Monaco): MarkerSeverity {
  return level === ErrorSeverity.Todo ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error;
}

function mapReactCompilerDiagnosticToMonacoMarker(detail: CompilerErrorDetail, monaco: Monaco): editor.IMarkerData | null {
  if (!detail.loc || typeof detail.loc === 'symbol') return null;

  const severity = mapReactCompilerSeverityToMonaco(detail.severity, monaco);
  const message = detail.printErrorMessage();

  return {
    severity,
    message,
    startLineNumber: detail.loc.start.line,
    startColumn: detail.loc.start.column + 1,
    endLineNumber: detail.loc.end.line,
    endColumn: detail.loc.end.column + 1,
  };
}

type ReactCompilerMarkerConfig = {
  monaco: Monaco;
  model: editor.ITextModel;
  details: CompilerErrorDetail[];
};

let decorations: string[] = [];

export function renderReactCompilerMarkers({ monaco, model, details }: ReactCompilerMarkerConfig): void {
  const markers = details
    .map(detail => mapReactCompilerDiagnosticToMonacoMarker(detail, monaco))
    .filter((marker): marker is editor.IMarkerData => marker !== null);

  if (markers.length > 0) {
    monaco.editor.setModelMarkers(model, 'owner', markers);

    const newDecorations = markers.map(marker => ({
      range: new monaco.Range(
        marker.startLineNumber,
        marker.startColumn,
        marker.endLineNumber,
        marker.endColumn
      ),
      options: {
        isWholeLine: true,
        glyphMarginClassName: 'bg-red-300',
      },
    }));

    decorations = model.deltaDecorations(decorations, newDecorations);
  } else {
    monaco.editor.setModelMarkers(model, 'owner', []);
    decorations = model.deltaDecorations(decorations, []);
  }
}
