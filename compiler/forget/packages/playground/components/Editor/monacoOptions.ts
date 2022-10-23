/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { EditorProps } from "@monaco-editor/react";

export const monacoOptions: Partial<EditorProps["options"]> = {
  fontSize: 14,
  padding: { top: 8 },
  scrollbar: {
    verticalScrollbarSize: 10,
  },
  minimap: {
    enabled: false,
  },
  formatOnPaste: true,
  formatOnType: true,
  fontFamily: '"Source Code Pro", monospace',
  glyphMargin: true,

  autoClosingBrackets: "languageDefined",
  autoClosingDelete: "always",
  autoClosingOvertype: "always",

  automaticLayout: true,
};
