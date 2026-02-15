/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Annotation hints for AI agents.
 *
 * Per the browser's WebIDL (AnnotationsDict in tool_registration_params.idl),
 * only `readOnlyHint` (boolean) is currently implemented in Chrome. The
 * additional fields below are library-level extensions inspired by the MCP
 * specification; they are silently ignored by the browser but may be useful
 * for higher-level agent frameworks.
 */
export type ToolAnnotations = {
  /** Indicates the tool only reads data (browser-native). */
  readOnlyHint?: boolean,
  /** Indicates a destructive operation (library extension, not in browser). */
  destructiveHint?: boolean,
  /** Indicates an idempotent operation (library extension, not in browser). */
  idempotentHint?: boolean,
  /** Indicates results can be cached (library extension, not in browser). */
  cache?: boolean,
};

export type WebMCPToolDefinition = {
  name: string,
  description: string,
  inputSchema: {...},
  /**
   * Optional JSON Schema for the tool's output.
   *
   * NOTE: `outputSchema` is NOT part of the browser's native
   * `ToolRegistrationParams` WebIDL. It is silently ignored by
   * `navigator.modelContext.registerTool()` but can be used by
   * higher-level agent frameworks that inspect tool metadata.
   */
  outputSchema?: {...},
  annotations?: ToolAnnotations,
  execute: (input: {[string]: mixed}) => mixed | Promise<mixed>,
};

export type ModelContextAPI = {
  registerTool: (tool: WebMCPToolDefinition) => void,
  unregisterTool: (name: string) => void,
  provideContext: (config: {tools: Array<WebMCPToolDefinition>}) => void,
  clearContext: () => void,
};

/**
 * Returns the navigator.modelContext API if available, or null.
 */
export function getModelContext(): ModelContextAPI | null {
  if (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    window.navigator.modelContext
  ) {
    return (window.navigator.modelContext: any);
  }
  return null;
}

/**
 * Returns true if the WebMCP API (navigator.modelContext) is available
 * in the current browsing context.
 */
export function isWebMCPAvailable(): boolean {
  return getModelContext() !== null;
}

/**
 * Returns true if the WebMCP testing API (navigator.modelContextTesting)
 * is available. This is the API used by the Model Context Tool Inspector
 * extension and requires the "WebMCP for testing" Chrome flag.
 */
export function isWebMCPTestingAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    !!window.navigator.modelContextTesting
  );
}

/**
 * Logs a warning when WebMCP is not available. Only fires in __DEV__.
 */
export function warnIfUnavailable(hookName: string): void {
  if (__DEV__) {
    if (!isWebMCPAvailable()) {
      console['warn'](
        '[react-webmcp] %s: navigator.modelContext is not available. ' +
          'Ensure you are running Chrome 146+ with the ' +
          '"WebMCP for testing" flag enabled.',
        hookName,
      );
    }
  }
}
