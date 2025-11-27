/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ParsedError, ErrorType } from '../types';

/**
 * Parse Vite error into structured format
 */
export function parseError(error: Error | unknown): ParsedError {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  let message = errorObj.message || '';
  // In production mode, Error.stack might be a getter that formats differently
  // Follow React's pattern: use String(error.stack) directly (see ReactFlightStackConfigV8.js)
  let stack = '';
  try {
    // Use String() conversion like React does - this handles both dev and production modes
    stack = String(errorObj.stack || '');
    
    // In production mode, if stack was set but getter returns formatted version,
    // the stack might include the error message. Remove it if present.
    // Only remove if stack starts with the exact message (not just contains it)
    // This handles cases where Error.stack getter prepends the error message
    // Be careful not to remove useful stack trace information
    if (stack && message) {
      const trimmedStack = stack.trim();
      const trimmedMessage = message.trim();
      // Only process if stack starts with message AND has additional lines
      // This ensures we don't accidentally clear useful stack traces
      if (trimmedStack.startsWith(trimmedMessage) && trimmedStack.length > trimmedMessage.length) {
        const lines = stack.split('\n');
        if (lines.length > 1) {
          // Remove first line (error message) and rejoin, but keep the rest
          const remainingStack = lines.slice(1).join('\n').trim();
          // Only use the remaining stack if it contains useful info (like "at" or file paths)
          if (remainingStack && (remainingStack.includes('at ') || remainingStack.match(/[^\s:()]+\.(?:tsx?|jsx?|mjs|js)/))) {
            stack = remainingStack;
          }
        }
      }
    }
  } catch (e) {
    // Stack property might throw in some environments
    stack = '';
  }

  // If message is generic (like "HTTP 500: /src/App.tsx"), try to extract from stack
  if (message.startsWith('HTTP ') && stack) {
    // Look for actual error message in stack trace
    const stackLines = stack.split('\n');
    for (const line of stackLines) {
      // Look for lines with actual error messages
      if (
        line.includes('Failed to resolve') ||
        line.includes('Cannot find module') ||
        line.includes('Module not found') ||
        line.includes('SyntaxError') ||
        line.includes('Parse error') ||
        line.includes('Transform failed')
      ) {
        message = line.trim();
        break;
      }
    }
  }

  // Extract error type from message (use both message and stack for better detection)
  const type = detectErrorType(message + ' ' + stack);

  // Extract file path and line/column from stack
  // In production mode, stack traces might be formatted differently
  // In some production builds, Error.stack might be read-only or formatted as "Error: message"
  let location = extractLocation(stack);
  
  // If location not found from stack, try extracting from message as fallback
  // Some errors include file paths in the message itself (e.g., "from 'src/App.tsx'")
  if (!location.file && message) {
    const messageLocation = extractLocationFromMessage(message);
    if (messageLocation.file) {
      location = messageLocation;
    }
  }
  
  // If we have file but no line/column from stack, try extracting from each stack line
  // In production, stack might be formatted differently (e.g., "Error: message\n    at ...")
  // or might be empty if Error.stack is a computed getter
  if (location.file && !location.line && stack) {
    const stackLines = stack.split('\n');
    for (const line of stackLines) {
      const lineLocation = extractLocation(line.trim());
      // If this line has a complete location (file + line + column), use it
      if (lineLocation.file && lineLocation.line && lineLocation.column) {
        location = lineLocation;
        break;
      }
    }
  }

  // Extract component name from stack
  const component = extractComponentName(stack);
  
  // If location not found from stack, try extracting from message as fallback
  // Some error formats include file path in the message
  if (!location.file && message) {
    const messageLocation = extractLocationFromMessage(message);
    if (messageLocation.file) {
      Object.assign(location, messageLocation);
    }
  }

  const parsed: ParsedError = {
    type,
    message,
  };
  if (stack) parsed.stack = stack;
  if (location.file) parsed.file = location.file;
  if (location.line !== undefined) parsed.line = location.line;
  if (location.column !== undefined) parsed.column = location.column;
  if (component) parsed.component = component;
  return parsed;
}

/**
 * Detect error type from error message
 */
function detectErrorType(message: string): ErrorType {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('failed to resolve import') ||
    lowerMessage.includes('cannot find module') ||
    lowerMessage.includes('module not found') ||
    lowerMessage.includes('could not be resolved') ||
    lowerMessage.includes('dependencies are imported but could not be resolved')
  ) {
    return 'MODULE_NOT_FOUND';
  }

  if (
    lowerMessage.includes('failed to resolve') ||
    lowerMessage.includes('module resolution')
  ) {
    return 'MODULE_RESOLUTION_ERROR';
  }

  if (
    lowerMessage.includes('transform failed') ||
    lowerMessage.includes('transformation error')
  ) {
    return 'TRANSFORM_ERROR';
  }

  if (
    lowerMessage.includes('unexpected token') ||
    lowerMessage.includes('syntax error') ||
    lowerMessage.includes('parse error') ||
    lowerMessage.includes('unterminated') ||
    lowerMessage.includes('failed to scan')
  ) {
    return 'SYNTAX_ERROR';
  }

  if (
    lowerMessage.includes('type') &&
    (lowerMessage.includes('error') || lowerMessage.includes('does not exist'))
  ) {
    return 'TYPE_ERROR';
  }

  if (lowerMessage.includes('hmr') || lowerMessage.includes('hot module')) {
    return 'HMR_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Extract file location from stack trace
 */
function extractLocation(stack: string): {
  file?: string;
  line?: number;
  column?: number;
} {
  if (!stack || typeof stack !== 'string') return {};
  
  // Normalize stack - remove any leading/trailing whitespace
  const normalizedStack = stack.trim();
  
  // Match patterns like: "at src/App.tsx:5:23" or "at App (src/App.tsx:12:5)"
  // Also handle: "src/App.tsx:5:23" (without "at")
  // Handle both single-line and multi-line stack traces
  // File paths can contain: letters, numbers, slashes, dots, dashes, underscores
  // In production mode, stack traces might be formatted differently
  const patterns = [
    // Pattern 1: "at App (src/App.tsx:12:5)" - with component name in parentheses
    // This pattern must come first to avoid matching "at App" as a file path
    // File path can contain slashes, so we match any non-whitespace, non-colon, non-paren chars
    /at\s+\w+\s+\(([^\s:()]+):(\d+):(\d+)\)/,
    // Pattern 2: "(src/App.tsx:12:5)" - in parentheses without "at" or component name
    /\(([^\s:()]+):(\d+):(\d+)\)/,
    // Pattern 3: "at src/App.tsx:5:23" - direct file path after "at" (most common)
    // Use non-greedy match to avoid matching too much
    /at\s+([^\s:()]+?):(\d+):(\d+)/,
    // Pattern 4: "src/App.tsx:5:23" - standalone (start of string or after whitespace)
    /(?:^|\s)([^\s:()]+):(\d+):(\d+)(?:\s|$|\))/m,
    // Pattern 5: More permissive - match any file path with extension
    /([^\s:()]+\.(?:tsx?|jsx?|mjs|js)):(\d+):(\d+)/,
  ];

  for (const pattern of patterns) {
    const locationMatch = normalizedStack.match(pattern);
    if (locationMatch) {
      // Check that we have all required capture groups (file, line, column)
      const file = locationMatch[1];
      const lineStr = locationMatch[2];
      const columnStr = locationMatch[3];
      
      if (file && lineStr && columnStr) {
        const line = parseInt(lineStr, 10);
        const column = parseInt(columnStr, 10);
        
        // Validate that we got reasonable values
        if (!isNaN(line) && !isNaN(column) && line > 0 && column >= 0) {
          return { file, line, column };
        }
      }
    }
  }

  return {};
}

/**
 * Extract component name from stack trace
 */
function extractComponentName(stack: string): string | undefined {
  if (!stack || typeof stack !== 'string') return undefined;
  
  // Normalize stack - remove any leading/trailing whitespace
  const normalizedStack = stack.trim();
  
  // Match patterns like: "at App (src/App.tsx:12:5)" or "at App src/App.tsx:12:5"
  // Try multiple patterns to handle different stack trace formats
  // In production mode, stack traces might be formatted differently
  const patterns = [
    // Pattern 1: "at App (src/App.tsx:12:5)" - most common format
    /at\s+(\w+)\s+\([^)]+\)/,
    // Pattern 2: "at App src/App.tsx:12:5" - without parentheses
    /at\s+(\w+)\s+[^\s:()]+:\d+:\d+/,
    // Pattern 3: "App (src/App.tsx:12:5)" - at start of line (no "at")
    /^\s*(\w+)\s+\([^)]+\)/m,
    // Pattern 4: "at App" followed by file path - more permissive
    /at\s+(\w+)(?:\s+\(|\s+[^\s:()]+)/,
  ];

  for (const pattern of patterns) {
    const componentMatch = normalizedStack.match(pattern);
    if (componentMatch && componentMatch[1]) {
      // Validate that it's a reasonable component name (not a file path)
      const componentName = componentMatch[1];
      // Component names shouldn't contain slashes, dots, or colons
      if (!componentName.includes('/') && !componentName.includes('\\') && !componentName.includes('.')) {
        return componentName;
      }
    }
  }

  return undefined;
}

/**
 * Extract location from error message as fallback
 * Some errors include file paths in the message itself
 */
function extractLocationFromMessage(message: string): {
  file?: string;
  line?: number;
  column?: number;
} {
  // Match patterns like: "from 'src/App.tsx'" or "in src/App.tsx:5:23"
  // Also match: "from 'src/App.tsx:5:23'" with line/column
  const patterns = [
    // Pattern 1: "from 'src/App.tsx:5:23'" or "in src/App.tsx:5:23"
    /(?:from|in)\s+['"]?([^\s'":]+\.(?:tsx?|jsx?|mjs|js)):(\d+):(\d+)['"]?/,
    // Pattern 2: "from 'src/App.tsx'" (file only)
    /(?:from|in)\s+['"]?([^\s'":]+\.(?:tsx?|jsx?|mjs|js))['"]?/,
    // Pattern 3: Any file path with line:column in message
    /['"]([^\s'":]+\.(?:tsx?|jsx?|mjs|js)):(\d+):(\d+)['"]/,
    // Pattern 4: Standalone file path with line:column
    /([^\s'":]+\.(?:tsx?|jsx?|mjs|js)):(\d+):(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const file = match[1];
      const line = match[2] ? parseInt(match[2], 10) : undefined;
      const column = match[3] ? parseInt(match[3], 10) : undefined;
      
      if (file && (!isNaN(line as any) || line === undefined)) {
        const result: { file?: string; line?: number; column?: number } = { file };
        if (line !== undefined) {
          result.line = line;
        }
        if (column !== undefined) {
          result.column = column;
        }
        return result;
      }
    }
  }

  return {};
}

