/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOM = require('react-dom');

// Isolate test renderer.
jest.resetModules();
const React = require('react');
const ReactCache = require('react-cache');
const ReactTestRenderer = require('react-test-renderer');

function sleep(period) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, period);
  });
}

describe('ReactTestRenderer', () => {
  it('should warn if used to render a ReactDOM portal', () => {
    const container = document.createElement('div');
    expect(() => {
      expect(() => {
        ReactTestRenderer.create(ReactDOM.createPortal('foo', container));
      }).toThrow();
    }).toWarnDev('An invalid container has been provided.', {
      withoutStack: true,
    });
  });

  describe('act', () => {
    it('should work', () => {
      function App() {
        let [ctr, setCtr] = React.useState(0);
        React.useEffect(() => {
          setCtr(1);
        });
        return ctr;
      }
      let root;
      ReactTestRenderer.act(() => {
        root = ReactTestRenderer.create(<App />);
      });
      expect(root.toJSON()).toEqual('1');
    });
    describe('async', () => {
      beforeEach(() => {
        jest.useRealTimers();
      });
      afterEach(() => {
        jest.useFakeTimers();
      });
      it('should work async too', async () => {
        function App() {
          let [ctr, setCtr] = React.useState(0);
          async function someAsyncFunction() {
            await sleep(100);
            setCtr(1);
          }
          React.useEffect(() => {
            someAsyncFunction();
          }, []);
          return ctr;
        }
        let root;
        await ReactTestRenderer.act(async () => {
          // todo - I don't understand why a nested async act call
          // flushes the effect correctly
          await ReactTestRenderer.act(async () => {
            root = ReactTestRenderer.create(<App />);
          });
          await sleep(200);
        });
        expect(root.toJSON()).toEqual('1');
      });
    });
  });

  describe('timed out Suspense hidden subtrees should not be observable via toJSON', () => {
    let AsyncText;
    let PendingResources;
    let TextResource;

    beforeEach(() => {
      PendingResources = {};
      TextResource = ReactCache.unstable_createResource(
        text =>
          new Promise(resolve => {
            PendingResources[text] = resolve;
          }),
        text => text,
      );

      AsyncText = ({text}) => {
        const value = TextResource.read(text);
        return value;
      };
    });

    it('for root Suspense components', async done => {
      const App = ({text}) => {
        return (
          <React.Suspense fallback="fallback">
            <AsyncText text={text} />
          </React.Suspense>
        );
      };

      const root = ReactTestRenderer.create(<App text="initial" />);
      PendingResources.initial('initial');
      await Promise.resolve();
      expect(root.toJSON()).toEqual('initial');

      root.update(<App text="dynamic" />);
      expect(root.toJSON()).toEqual('fallback');

      PendingResources.dynamic('dynamic');
      await Promise.resolve();
      expect(root.toJSON()).toEqual('dynamic');

      done();
    });

    it('for nested Suspense components', async done => {
      const App = ({text}) => {
        return (
          <div>
            <React.Suspense fallback="fallback">
              <AsyncText text={text} />
            </React.Suspense>
          </div>
        );
      };

      const root = ReactTestRenderer.create(<App text="initial" />);
      PendingResources.initial('initial');
      await Promise.resolve();
      expect(root.toJSON().children).toEqual(['initial']);

      root.update(<App text="dynamic" />);
      expect(root.toJSON().children).toEqual(['fallback']);

      PendingResources.dynamic('dynamic');
      await Promise.resolve();
      expect(root.toJSON().children).toEqual(['dynamic']);

      done();
    });
  });
});
