/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { errorAssistant } from '../src/vite-plugin';
import type { Plugin } from 'vite';

// Mock Python bridge
jest.mock('../src/bridge/python-bridge', () => ({
  PythonBridge: jest.fn().mockImplementation(() => ({
    startServer: jest.fn().mockResolvedValue(undefined),
    stopServer: jest.fn().mockResolvedValue(undefined),
    isServerRunning: jest.fn().mockReturnValue(false),
    analyzeError: jest.fn(),
  })),
}));

// Mock error interceptor
jest.mock('../src/error/interceptor', () => ({
  ErrorInterceptor: jest.fn().mockImplementation(() => ({
    handleError: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('errorAssistant', () => {
  it('should return a Vite plugin', () => {
    const plugin = errorAssistant();
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('error-assistant');
    expect(plugin.enforce).toBe('post');
  });

  it('should accept configuration options', () => {
    const plugin = errorAssistant({
      enabled: false,
      configPath: '/custom/config.json',
      pythonServerPort: 9000,
    });

    expect(plugin).toBeDefined();
  });

  it('should have buildStart hook', () => {
    const plugin = errorAssistant();
    expect(plugin.buildStart).toBeDefined();
    expect(typeof plugin.buildStart).toBe('function');
  });

  it('should have buildEnd hook', () => {
    const plugin = errorAssistant();
    expect(plugin.buildEnd).toBeDefined();
    expect(typeof plugin.buildEnd).toBe('function');
  });

  it('should have handleHotUpdate hook', () => {
    const plugin = errorAssistant();
    expect(plugin.handleHotUpdate).toBeDefined();
    expect(typeof plugin.handleHotUpdate).toBe('function');
  });

  it('should have closeBundle hook', () => {
    const plugin = errorAssistant();
    expect(plugin.closeBundle).toBeDefined();
    expect(typeof plugin.closeBundle).toBe('function');
  });

  describe('when disabled', () => {
    it('should not initialize when enabled is false', async () => {
      const plugin = errorAssistant({ enabled: false });
      await plugin.buildStart?.({} as any);

      // Should not crash, just return early
      expect(plugin).toBeDefined();
    });
  });
});

