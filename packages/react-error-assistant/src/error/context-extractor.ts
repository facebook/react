/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ParsedError } from '../types';

/**
 * Error context for RAG query
 */
export interface ErrorContext {
  component?: string;
  framework: string;
  bundler: string;
  errorType: string;
}

/**
 * Extract context from parsed error for RAG query
 */
export function extractContext(parsedError: ParsedError): ErrorContext {
  const context: ErrorContext = {
    framework: 'react',
    bundler: 'vite',
    errorType: parsedError.type,
  };
  if (parsedError.component !== undefined) {
    context.component = parsedError.component;
  }
  return context;
}

/**
 * Build query string for RAG pipeline
 */
export function buildQuery(parsedError: ParsedError, context: ErrorContext): string {
  const parts: string[] = [
    parsedError.message,
    context.errorType,
    context.framework,
    context.bundler,
  ];

  if (context.component) {
    parts.push(context.component);
  }

  if (parsedError.file) {
    parts.push(parsedError.file);
  }

  return parts.join(' ');
}

