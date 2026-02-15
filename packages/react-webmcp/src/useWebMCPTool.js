/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {getModelContext, warnIfUnavailable} from './ModelContext';
import type {ToolAnnotations} from './ModelContext';

const {useEffect, useRef} = React;

export type WebMCPToolConfig = {
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

/**
 * Produces a stable fingerprint for a single tool definition so we can
 * detect meaningful changes without being tricked by new object references
 * created on every render (e.g. inline schema literals).
 */
function toolFingerprint(config: WebMCPToolConfig): string {
  return (
    config.name +
    '::' +
    config.description +
    '::' +
    JSON.stringify(config.inputSchema) +
    '::' +
    JSON.stringify(config.outputSchema != null ? config.outputSchema : {}) +
    '::' +
    JSON.stringify(config.annotations != null ? config.annotations : {})
  );
}

/**
 * Register a single WebMCP tool via the imperative API.
 *
 * The tool is registered with `navigator.modelContext.registerTool()` when
 * the component mounts and unregistered with `unregisterTool()` on unmount.
 * If the tool definition changes (name, description, schemas, or
 * annotations), the previous tool is unregistered and the new one is
 * registered.
 *
 * Object/array props like `inputSchema` and `annotations` are compared by
 * value (serialised fingerprint), so passing inline literals on every render
 * will NOT cause unnecessary re-registration.
 *
 * The `execute` callback is always called through a ref, so it does not
 * need to be memoised by the consumer.
 */
export function useWebMCPTool(config: WebMCPToolConfig): void {
  const registeredNameRef = useRef<string | null>(null);
  const configRef = useRef<WebMCPToolConfig>(config);
  configRef.current = config;

  // Derive a stable fingerprint from the definition values.
  const fingerprint = toolFingerprint(config);

  useEffect(() => {
    const mc = getModelContext();
    if (!mc) {
      warnIfUnavailable('useWebMCPTool');
      return;
    }

    // Unregister the previous tool if the name changed
    if (
      registeredNameRef.current &&
      registeredNameRef.current !== config.name
    ) {
      try {
        mc.unregisterTool(registeredNameRef.current);
      } catch (e) {
        // Tool may have already been unregistered
      }
    }

    // Build the tool definition matching the navigator.modelContext shape.
    // The execute function is always routed through configRef so callers
    // never need to memoise their handler.
    const toolDef: {[string]: mixed} = {
      name: config.name,
      description: config.description,
      inputSchema: config.inputSchema,
      execute: (input: {[string]: mixed}) => {
        return configRef.current.execute(input);
      },
    };
    if (config.outputSchema) {
      toolDef.outputSchema = config.outputSchema;
    }
    if (config.annotations) {
      toolDef.annotations = config.annotations;
    }

    try {
      mc.registerTool((toolDef: any));
      registeredNameRef.current = config.name;
    } catch (err) {
      if (__DEV__) {
        console['error'](
          '[react-webmcp] Failed to register tool "%s": %s',
          config.name,
          err,
        );
      }
    }

    return () => {
      try {
        mc.unregisterTool(config.name);
      } catch (e) {
        // Tool may have already been unregistered externally
      }
      registeredNameRef.current = null;
    };
    // fingerprint captures the serialised value of all definition fields;
    // config.name is included so the cleanup closure captures the correct name.
  }, [fingerprint, config.name]);
}
