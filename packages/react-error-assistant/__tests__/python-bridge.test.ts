/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PythonBridge } from '../src/bridge/python-bridge';
import type { ParsedError } from '../src/types';
import type { ErrorContext } from '../src/error/context-extractor';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  get: jest.fn(),
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('PythonBridge', () => {
  let bridge: PythonBridge;

  beforeEach(() => {
    bridge = new PythonBridge({
      port: 8080,
      knowledgeBasePath: '/test/kb',
    });
  });

  describe('initialization', () => {
    it('should create bridge instance', () => {
      expect(bridge).toBeDefined();
    });

    it('should use default port if not provided', () => {
      const defaultBridge = new PythonBridge();
      expect(defaultBridge).toBeDefined();
    });

    it('should use custom knowledge base path', () => {
      const customBridge = new PythonBridge({
        knowledgeBasePath: '/custom/path',
      });
      expect(customBridge).toBeDefined();
    });
  });

  describe('isServerRunning', () => {
    it('should return false initially', () => {
      expect(bridge.isServerRunning()).toBe(false);
    });
  });

  describe('analyzeError', () => {
    it('should throw error if server not running', async () => {
      const parsedError: ParsedError = {
        type: 'MODULE_NOT_FOUND',
        message: "Cannot find module 'react'",
      };

      const context: ErrorContext = {
        framework: 'react',
        bundler: 'vite',
        errorType: 'MODULE_NOT_FOUND',
      };

      await expect(
        bridge.analyzeError(parsedError, context)
      ).rejects.toThrow('Python server is not running');
    });
  });
});

