/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactStrictMode', () => {
  let React;
  let ReactDOM;
  let act;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');

    const TestUtils = require('react-dom/test-utils');
    act = TestUtils.unstable_concurrentAct;

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableStrictEffects = __DEV__;
  });

  describe('levels', () => {
    let log;

    beforeEach(() => {
      log = [];
    });

    function Component({label}) {
      React.useEffect(() => {
        log.push(`${label}: useEffect mount`);
        return () => log.push(`${label}: useEffect unmount`);
      });

      React.useLayoutEffect(() => {
        log.push(`${label}: useLayoutEffect mount`);
        return () => log.push(`${label}: useLayoutEffect unmount`);
      });

      log.push(`${label}: render`);

      return null;
    }

    // @gate experimental
    it('should default to not strict', () => {
      act(() => {
        const container = document.createElement('div');
        const root = ReactDOM.createRoot(container);
        root.render(<Component label="A" />);
      });

      expect(log).toEqual([
        'A: render',
        'A: useLayoutEffect mount',
        'A: useEffect mount',
      ]);
    });

    if (__DEV__) {
      // @gate experimental
      it('should default to level 1 (legacy mode)', () => {
        act(() => {
          const container = document.createElement('div');
          const root = ReactDOM.createRoot(container);
          root.render(
            <React.StrictMode>
              <Component label="A" />
            </React.StrictMode>,
          );
        });

        expect(log).toEqual([
          'A: render',
          'A: render',
          'A: useLayoutEffect mount',
          'A: useEffect mount',
        ]);
      });

      // @gate experimental
      it('should support level 1 (legacy mode)', () => {
        act(() => {
          const container = document.createElement('div');
          const root = ReactDOM.createRoot(container);
          root.render(
            <React.StrictMode unstable_level={1}>
              <Component label="A" />
            </React.StrictMode>,
          );
        });

        expect(log).toEqual([
          'A: render',
          'A: render',
          'A: useLayoutEffect mount',
          'A: useEffect mount',
        ]);
      });

      // @gate experimental
      it('should support level 2 (legacy + strict effects mode)', () => {
        act(() => {
          const container = document.createElement('div');
          const root = ReactDOM.createRoot(container);
          root.render(
            <React.StrictMode unstable_level={2}>
              <Component label="A" />
            </React.StrictMode>,
          );
        });

        expect(log).toEqual([
          'A: render',
          'A: render',
          'A: useLayoutEffect mount',
          'A: useEffect mount',
          'A: useLayoutEffect unmount',
          'A: useEffect unmount',
          'A: useLayoutEffect mount',
          'A: useEffect mount',
        ]);
      });

      // @gate experimental
      it('should allow level to be increased with nesting', () => {
        act(() => {
          const container = document.createElement('div');
          const root = ReactDOM.createRoot(container);
          root.render(
            <>
              <Component label="A" />
              <React.StrictMode unstable_level={1}>
                <Component label="B" />
                <React.StrictMode unstable_level={2}>
                  <Component label="C" />
                </React.StrictMode>
                ,
              </React.StrictMode>
              ,
            </>,
          );
        });

        expect(log).toEqual([
          'A: render',
          'B: render',
          'B: render',
          'C: render',
          'C: render',
          'A: useLayoutEffect mount',
          'B: useLayoutEffect mount',
          'C: useLayoutEffect mount',
          'A: useEffect mount',
          'B: useEffect mount',
          'C: useEffect mount',
          'C: useLayoutEffect unmount',
          'C: useEffect unmount',
          'C: useLayoutEffect mount',
          'C: useEffect mount',
        ]);
      });

      // @gate experimental
      it('should not allow level to be decreased with nesting', () => {
        act(() => {
          const container = document.createElement('div');
          const root = ReactDOM.createRoot(container);
          root.render(
            <>
              <Component label="A" />
              <React.StrictMode unstable_level={1}>
                <Component label="B" />
                <React.StrictMode unstable_level={0}>
                  <Component label="C" />
                </React.StrictMode>
                ,
              </React.StrictMode>
              ,
            </>,
          );
        });

        expect(log).toEqual([
          'A: render',
          'B: render',
          'B: render',
          'C: render',
          'C: render',
          'A: useLayoutEffect mount',
          'B: useLayoutEffect mount',
          'C: useLayoutEffect mount',
          'A: useEffect mount',
          'B: useEffect mount',
          'C: useEffect mount',
        ]);
      });
    }
  });
});
