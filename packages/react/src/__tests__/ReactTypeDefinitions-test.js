/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Regression tests for React 19.2 API export completeness.
 * These tests verify the runtime exports exist for the APIs whose TypeScript
 * type definitions were added in this PR.
 *
 * Issue: TypeScript type gaps on Activity, use(), useActionState, useOptimistic
 */

'use strict';

describe('React 19.2 API exports', () => {
  let React;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
  });

  describe('Activity component', () => {
    it('exports Activity', () => {
      expect(React.Activity).toBeDefined();
    });

    it('Activity is not null', () => {
      expect(React.Activity).not.toBeNull();
    });
  });

  describe('use() hook', () => {
    it('exports use', () => {
      expect(React.use).toBeDefined();
    });

    it('use is a function', () => {
      expect(typeof React.use).toBe('function');
    });
  });

  describe('useActionState hook', () => {
    it('exports useActionState', () => {
      expect(React.useActionState).toBeDefined();
    });

    it('useActionState is a function', () => {
      expect(typeof React.useActionState).toBe('function');
    });
  });

  describe('useOptimistic hook', () => {
    it('exports useOptimistic', () => {
      expect(React.useOptimistic).toBeDefined();
    });

    it('useOptimistic is a function', () => {
      expect(typeof React.useOptimistic).toBe('function');
    });
  });

  describe('ViewTransition component', () => {
    it('exports ViewTransition', () => {
      expect(React.ViewTransition).toBeDefined();
    });
  });

  describe('captureOwnerStack', () => {
    it('exports captureOwnerStack', () => {
      expect(React.captureOwnerStack).toBeDefined();
    });

    it('captureOwnerStack is a function', () => {
      expect(typeof React.captureOwnerStack).toBe('function');
    });
  });

  describe('addTransitionType', () => {
    it('exports addTransitionType', () => {
      expect(React.addTransitionType).toBeDefined();
    });

    it('addTransitionType is a function', () => {
      expect(typeof React.addTransitionType).toBe('function');
    });
  });

  describe('concurrent mode hooks', () => {
    it('exports useTransition', () => {
      expect(typeof React.useTransition).toBe('function');
    });

    it('exports useDeferredValue', () => {
      expect(typeof React.useDeferredValue).toBe('function');
    });

    it('exports startTransition', () => {
      expect(typeof React.startTransition).toBe('function');
    });

    it('exports useId', () => {
      expect(typeof React.useId).toBe('function');
    });
  });

  describe('standard hooks present for completeness', () => {
    it('exports useState', () => {
      expect(typeof React.useState).toBe('function');
    });

    it('exports useEffect', () => {
      expect(typeof React.useEffect).toBe('function');
    });

    it('exports useCallback', () => {
      expect(typeof React.useCallback).toBe('function');
    });

    it('exports useMemo', () => {
      expect(typeof React.useMemo).toBe('function');
    });

    it('exports useContext', () => {
      expect(typeof React.useContext).toBe('function');
    });

    it('exports useReducer', () => {
      expect(typeof React.useReducer).toBe('function');
    });

    it('exports useRef', () => {
      expect(typeof React.useRef).toBe('function');
    });
  });
});
