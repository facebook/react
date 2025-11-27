/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { extractContext, buildQuery } from '../src/error/context-extractor';
import type { ParsedError } from '../src/types';

describe('ContextExtractor', () => {
  describe('extractContext', () => {
    it('should extract context from parsed error', () => {
      const parsedError: ParsedError = {
        type: 'MODULE_NOT_FOUND',
        message: "Failed to resolve import 'react'",
        component: 'App',
        file: 'src/App.tsx',
        line: 5,
        column: 23,
      };

      const context = extractContext(parsedError);

      expect(context.component).toBe('App');
      expect(context.framework).toBe('react');
      expect(context.bundler).toBe('vite');
      expect(context.errorType).toBe('MODULE_NOT_FOUND');
    });

    it('should handle errors without component', () => {
      const parsedError: ParsedError = {
        type: 'SYNTAX_ERROR',
        message: 'Unexpected token',
        file: 'src/index.tsx',
      };

      const context = extractContext(parsedError);

      expect(context.component).toBeUndefined();
      expect(context.framework).toBe('react');
      expect(context.bundler).toBe('vite');
      expect(context.errorType).toBe('SYNTAX_ERROR');
    });
  });

  describe('buildQuery', () => {
    it('should build query string from error and context', () => {
      const parsedError: ParsedError = {
        type: 'MODULE_NOT_FOUND',
        message: "Cannot find module 'react'",
        component: 'App',
        file: 'src/App.tsx',
      };

      const context = extractContext(parsedError);
      const query = buildQuery(parsedError, context);

      expect(query).toContain("Cannot find module 'react'");
      expect(query).toContain('MODULE_NOT_FOUND');
      expect(query).toContain('react');
      expect(query).toContain('vite');
      expect(query).toContain('App');
      expect(query).toContain('src/App.tsx');
    });

    it('should build query without component if not present', () => {
      const parsedError: ParsedError = {
        type: 'TRANSFORM_ERROR',
        message: 'Transform failed',
        file: 'src/index.ts',
      };

      const context = extractContext(parsedError);
      const query = buildQuery(parsedError, context);

      expect(query).toContain('Transform failed');
      expect(query).toContain('TRANSFORM_ERROR');
      expect(query).not.toContain('undefined');
    });
  });
});

