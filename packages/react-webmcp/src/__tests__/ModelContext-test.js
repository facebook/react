/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let getModelContext;
let isWebMCPAvailable;
let isWebMCPTestingAvailable;
let warnIfUnavailable;
let assertConsoleWarnDev;

describe('ModelContext', () => {
  beforeEach(() => {
    jest.resetModules();

    const ModelContext = require('react-webmcp/src/ModelContext');
    getModelContext = ModelContext.getModelContext;
    isWebMCPAvailable = ModelContext.isWebMCPAvailable;
    isWebMCPTestingAvailable = ModelContext.isWebMCPTestingAvailable;
    warnIfUnavailable = ModelContext.warnIfUnavailable;

    assertConsoleWarnDev = require('internal-test-utils').assertConsoleWarnDev;
  });

  afterEach(() => {
    // Clean up any mocked navigator properties
    if (Object.getOwnPropertyDescriptor(window.navigator, 'modelContext')) {
      delete window.navigator.modelContext;
    }
    if (
      Object.getOwnPropertyDescriptor(window.navigator, 'modelContextTesting')
    ) {
      delete window.navigator.modelContextTesting;
    }
  });

  function installMockModelContext() {
    const mc = {
      registerTool: jest.fn(),
      unregisterTool: jest.fn(),
      provideContext: jest.fn(),
      clearContext: jest.fn(),
    };
    Object.defineProperty(window.navigator, 'modelContext', {
      value: mc,
      configurable: true,
      writable: true,
    });
    return mc;
  }

  function installMockModelContextTesting() {
    const mct = {
      getTools: jest.fn(),
    };
    Object.defineProperty(window.navigator, 'modelContextTesting', {
      value: mct,
      configurable: true,
      writable: true,
    });
    return mct;
  }

  describe('getModelContext', () => {
    it('returns null when navigator.modelContext is not available', () => {
      expect(getModelContext()).toBe(null);
    });

    it('returns the modelContext API when available', () => {
      const mc = installMockModelContext();
      expect(getModelContext()).toBe(mc);
    });

    it('returns an object with the expected API surface', () => {
      installMockModelContext();
      const mc = getModelContext();
      expect(mc).not.toBe(null);
      expect(typeof mc.registerTool).toBe('function');
      expect(typeof mc.unregisterTool).toBe('function');
      expect(typeof mc.provideContext).toBe('function');
      expect(typeof mc.clearContext).toBe('function');
    });
  });

  describe('isWebMCPAvailable', () => {
    it('returns false when navigator.modelContext is not present', () => {
      expect(isWebMCPAvailable()).toBe(false);
    });

    it('returns true when navigator.modelContext is present', () => {
      installMockModelContext();
      expect(isWebMCPAvailable()).toBe(true);
    });
  });

  describe('isWebMCPTestingAvailable', () => {
    it('returns false when navigator.modelContextTesting is not present', () => {
      expect(isWebMCPTestingAvailable()).toBe(false);
    });

    it('returns true when navigator.modelContextTesting is present', () => {
      installMockModelContextTesting();
      expect(isWebMCPTestingAvailable()).toBe(true);
    });

    it('is independent of modelContext availability', () => {
      // modelContext present but not modelContextTesting
      installMockModelContext();
      expect(isWebMCPTestingAvailable()).toBe(false);

      // Both present
      installMockModelContextTesting();
      expect(isWebMCPTestingAvailable()).toBe(true);
    });
  });

  describe('warnIfUnavailable', () => {
    it('does not warn when modelContext is available', () => {
      installMockModelContext();
      // Should not trigger any console.warn
      warnIfUnavailable('useWebMCPTool');
    });

    it('warns when modelContext is not available', () => {
      warnIfUnavailable('useWebMCPTool');
      if (__DEV__) {
        assertConsoleWarnDev([
          '[react-webmcp] useWebMCPTool: navigator.modelContext is not available. ' +
            'Ensure you are running Chrome 146+ with the ' +
            '"WebMCP for testing" flag enabled.',
        ]);
      }
    });

    it('includes the hook name in the warning message', () => {
      warnIfUnavailable('useWebMCPContext');
      if (__DEV__) {
        assertConsoleWarnDev([
          '[react-webmcp] useWebMCPContext: navigator.modelContext is not available. ' +
            'Ensure you are running Chrome 146+ with the ' +
            '"WebMCP for testing" flag enabled.',
        ]);
      }
    });
  });
});
