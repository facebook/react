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
    it('can use .act() to flush effects', () => {
      function App(props) {
        let [ctr, setCtr] = React.useState(0);
        React.useEffect(() => {
          props.callback();
          setCtr(1);
        });
        return ctr;
      }
      let called = false;
      let root;
      ReactTestRenderer.act(() => {
        root = ReactTestRenderer.create(
          <App
            callback={() => {
              called = true;
            }}
          />,
        );
      });

      expect(called).toBe(true);
      expect(root.toJSON()).toEqual('1');
    });

    it("warns if you don't use .act", () => {
      let setCtr;
      function App(props) {
        let [ctr, _setCtr] = React.useState(0);
        setCtr = _setCtr;
        return ctr;
      }

      ReactTestRenderer.create(<App />);

      expect(() => {
        setCtr(1);
      }).toWarnDev([
        'An update to App inside a test was not wrapped in act(...)',
      ]);
    });

    describe('async', () => {
      beforeEach(() => {
        jest.useRealTimers();
      });

      afterEach(() => {
        jest.useFakeTimers();
      });

      it('should work with async/await', async () => {
        function App() {
          let [ctr, setCtr] = React.useState(0);
          async function someAsyncFunction() {
            await null;
            setCtr(1);
          }
          React.useEffect(() => {
            someAsyncFunction();
          }, []);
          return ctr;
        }
        let root;
        await ReactTestRenderer.act(async () => {
          // this test will fail
          // claiming to only fire the effect after this act call has exited

          // an odd situation
          // the sync version of act flushes the effect,
          // but the promise is left hanging until the top level
          // one resolves (even if you await a timer or so)
          ReactTestRenderer.act(() => {
            root = ReactTestRenderer.create(<App />);
          });
          await null;

          // the first workaround is to use the async version, which oddly works

          // another workaround is to do this -
          // await null
          // ReactTestRenderer.act(() => {});

          // this same test passes fine with the TestUtils sync version
          // or the async version of TestRenderer.act(...)
          // smells like something to do with our test setup
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
