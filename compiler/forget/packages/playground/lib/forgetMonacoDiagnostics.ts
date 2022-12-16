/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { Monaco } from "@monaco-editor/react";
import { Diagnostic, DiagnosticLevel } from "babel-plugin-react-forget-legacy";
import { MarkerSeverity, type editor } from "monaco-editor";

function mapForgetSeverityToMonaco(
  level: DiagnosticLevel,
  monaco: Monaco
): MarkerSeverity {
  switch (level) {
    case DiagnosticLevel.Error:
      return monaco.MarkerSeverity.Error;
    case DiagnosticLevel.Warning:
      return monaco.MarkerSeverity.Warning;
    default:
      return monaco.MarkerSeverity.Info;
  }
}

function mapForgetDiagnosticToMonacoMarker(
  { body, code, level, path, suggestion }: Diagnostic,
  monaco: Monaco
): editor.IMarkerData | null {
  if (path == null || path.node.loc == null) {
    return null;
  }
  const severity = mapForgetSeverityToMonaco(level, monaco);
  let message = `[${level.toUpperCase()}] ${body} (${code})`;
  if (suggestion != null) {
    message = message.concat(`\n\n${suggestion}`);
  }
  return {
    severity,
    message,
    startLineNumber: path.node.loc.start.line,
    startColumn: path.node.loc.start.column + 1,
    endLineNumber: path.node.loc.end.line,
    endColumn: path.node.loc.end.column + 1,
  };
}

type ForgetMarkerConfig = {
  monaco: Monaco;
  model: editor.ITextModel;
  diagnostics: Diagnostic[];
};
let decorations: string[] = [];
export function renderForgetMarkers({
  monaco,
  model,
  diagnostics,
}: ForgetMarkerConfig): void {
  let markers = [];
  for (const diag of diagnostics) {
    const marker = mapForgetDiagnosticToMonacoMarker(diag, monaco);
    if (marker == null) {
      continue;
    }
    markers.push(marker);
  }
  if (markers.length > 0) {
    monaco.editor.setModelMarkers(model, "owner", markers);
    const newDecorations = markers.map((marker) => {
      return {
        range: new monaco.Range(
          marker.startLineNumber,
          marker.startColumn,
          marker.endLineNumber,
          marker.endColumn
        ),
        options: {
          isWholeLine: true,
          glyphMarginClassName: "bg-red-300",
        },
      };
    });
    decorations = model.deltaDecorations(decorations, newDecorations);
  } else {
    monaco.editor.setModelMarkers(model, "owner", []);
    decorations = model.deltaDecorations(
      model.getAllDecorations().map((d) => d.id),
      []
    );
  }
}
