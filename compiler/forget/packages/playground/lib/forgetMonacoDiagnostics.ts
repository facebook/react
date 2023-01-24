/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { Monaco } from "@monaco-editor/react";
import { CompilerErrorDetail, ErrorSeverity } from "babel-plugin-react-forget";
import { MarkerSeverity, type editor } from "monaco-editor";

function mapForgetSeverityToMonaco(
  level: ErrorSeverity,
  monaco: Monaco
): MarkerSeverity {
  switch (level) {
    case ErrorSeverity.Todo:
    case ErrorSeverity.InvalidInput:
      return monaco.MarkerSeverity.Error;
    default:
      return monaco.MarkerSeverity.Warning;
  }
}

function mapForgetDiagnosticToMonacoMarker(
  detail: CompilerErrorDetail,
  monaco: Monaco
): editor.IMarkerData | null {
  if (detail.nodePath == null || detail.nodePath.node?.loc == null) {
    return null;
  }
  const severity = mapForgetSeverityToMonaco(detail.severity, monaco);
  let message = detail.errorMessage;
  return {
    severity,
    message,
    startLineNumber: detail.nodePath.node.loc.start.line,
    startColumn: detail.nodePath.node.loc.start.column + 1,
    endLineNumber: detail.nodePath.node.loc.end.line,
    endColumn: detail.nodePath.node.loc.end.column + 1,
  };
}

type ForgetMarkerConfig = {
  monaco: Monaco;
  model: editor.ITextModel;
  details: CompilerErrorDetail[];
};
let decorations: string[] = [];
export function renderForgetMarkers({
  monaco,
  model,
  details,
}: ForgetMarkerConfig): void {
  let markers = [];
  for (const detail of details) {
    const marker = mapForgetDiagnosticToMonacoMarker(detail, monaco);
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
