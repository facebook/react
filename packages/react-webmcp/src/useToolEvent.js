/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const {useEffect} = React;

/**
 * Listen for WebMCP tool lifecycle events on the window.
 *
 * The browser fires `toolactivated` when an AI agent invokes a declarative
 * tool (form fields are pre-filled) and `toolcancel` when the agent or
 * user cancels the operation.
 *
 * @param event - The event name: "toolactivated" or "toolcancel"
 * @param callback - Called with the tool name when the event fires
 * @param toolNameFilter - Optional: only fire for a specific tool name
 */
export function useToolEvent(
  event: 'toolactivated' | 'toolcancel',
  callback: (toolName: string) => void,
  toolNameFilter?: string,
): void {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e: any).detail;
      const toolName =
        (e: any).toolName != null
          ? (e: any).toolName
          : detail != null
            ? detail.toolName
            : undefined;
      if (!toolName) {
        return;
      }
      if (toolNameFilter && toolName !== toolNameFilter) {
        return;
      }
      callback(toolName);
    };

    window.addEventListener(event, handler);
    return () => {
      window.removeEventListener(event, handler);
    };
  }, [event, callback, toolNameFilter]);
}
