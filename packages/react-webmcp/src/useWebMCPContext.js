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
import type {WebMCPToolDefinition} from './ModelContext';

const {useEffect, useRef} = React;

/**
 * Produces a stable fingerprint string from a tools array so we can detect
 * meaningful changes without being tricked by new array references.
 * Compares tool names, descriptions, and serialised schemas/annotations.
 */
function toolsFingerprint(tools: Array<WebMCPToolDefinition>): string {
  return tools
    .map(function (t) {
      return (
        t.name +
        '::' +
        t.description +
        '::' +
        JSON.stringify(t.inputSchema) +
        '::' +
        JSON.stringify(t.outputSchema != null ? t.outputSchema : {}) +
        '::' +
        JSON.stringify(t.annotations != null ? t.annotations : {})
      );
    })
    .join('|');
}

/**
 * Register multiple WebMCP tools at once using `provideContext()`.
 *
 * Unlike `useWebMCPTool` which manages a single tool, `useWebMCPContext`
 * replaces the entire set of registered tools. This is useful when the
 * application state changes significantly and you want to expose a
 * completely different set of tools.
 *
 * On unmount, all tools are cleared via `clearContext()`.
 *
 * The hook performs a deep comparison of tool definitions (name, description,
 * inputSchema, annotations) so that passing a new array reference on every
 * render does NOT cause unnecessary re-registration.
 */
export function useWebMCPContext(config: {
  tools: Array<WebMCPToolDefinition>,
}): void {
  // Keep a ref to the latest tools so the execute callbacks always close
  // over current handlers without triggering the effect.
  const toolsRef = useRef(config.tools);
  toolsRef.current = config.tools;

  const fingerprint = toolsFingerprint(config.tools);

  useEffect(() => {
    const mc = getModelContext();
    if (!mc) {
      warnIfUnavailable('useWebMCPContext');
      return;
    }

    // Wrap execute functions so they always call through the latest ref,
    // allowing callers to pass inline arrow functions without triggering
    // the effect.
    const stableTools = toolsRef.current.map(function (tool, idx) {
      const def: {[string]: mixed} = {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: function (input: {[string]: mixed}) {
          return toolsRef.current[idx].execute(input);
        },
      };
      if (tool.annotations) {
        def.annotations = tool.annotations;
      }
      if (tool.outputSchema) {
        def.outputSchema = tool.outputSchema;
      }
      return def;
    });

    try {
      mc.provideContext({tools: (stableTools: any)});
    } catch (err) {
      if (__DEV__) {
        console['error']('[react-webmcp] Failed to provide context: %s', err);
      }
    }

    return () => {
      try {
        mc.clearContext();
      } catch (e) {
        // Context may have already been cleared
      }
    };
  }, [fingerprint]);
}
