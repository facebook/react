/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

runPlaceholderTests('ReactPlaceholder (mutation)', () =>
  require('react-noop-renderer'),
);
runPlaceholderTests('ReactPlaceholder (persistence)', () =>
  require('react-noop-renderer/persistent'),
);

function runPlaceholderTests(suiteLabel, loadReactNoop) {
  let React;
  let ReactNoop;
  let ReactFeatureFlags;
  let Fragment;
  let SimpleCacheProvider;
  let Placeholder;

  let cache;
  let TextResource;
  let textResourceShouldFail;

  describe(suiteLabel, () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
      ReactFeatureFlags.enableSuspense = true;
      React = require('react');
      Fragment = React.Fragment;
      ReactNoop = loadReactNoop();
      SimpleCacheProvider = require('simple-cache-provider');
      Placeholder = React.Placeholder;

      function invalidateCache() {
        cache = SimpleCacheProvider.createCache(invalidateCache);
      }
      invalidateCache();
      TextResource = SimpleCacheProvider.createResource(([text, ms = 0]) => {
        return new Promise((resolve, reject) =>
          setTimeout(() => {
            if (textResourceShouldFail) {
              ReactNoop.yield(`Promise rejected [${text}]`);
              reject(new Error('Failed to load: ' + text));
            } else {
              ReactNoop.yield(`Promise resolved [${text}]`);
              resolve(text);
            }
          }, ms),
        );
      }, ([text, ms]) => text);
      textResourceShouldFail = false;
    });

    function advanceTimers(ms) {
      // Note: This advances Jest's virtual time but not React's. Use
      // ReactNoop.expire for that.
      if (typeof ms !== 'number') {
        throw new Error('Must specify ms');
      }
      jest.advanceTimersByTime(ms);
      // Wait until the end of the current tick
      return new Promise(resolve => {
        setImmediate(resolve);
      });
    }

    function Text(props) {
      ReactNoop.yield(props.text);
      return props.text;
    }

    function AsyncText(props) {
      const text = props.text;
      try {
        TextResource.read(cache, [props.text, props.ms]);
        ReactNoop.yield(text);
        return text;
      } catch (promise) {
        if (typeof promise.then === 'function') {
          ReactNoop.yield(`Suspend! [${text}]`);
        } else {
          ReactNoop.yield(`Error! [${text}]`);
        }
        throw promise;
      }
    }

    it('times out children that are already hidden', async () => {
      class HiddenText extends React.PureComponent {
        render() {
          const text = this.props.text;
          ReactNoop.yield(text);
          return <span hidden={true}>{text}</span>;
        }
      }

      function App(props) {
        return (
          <Placeholder delayMs={500} fallback={<Text text="Loading..." />}>
            <HiddenText text="A" />
            <span>
              <AsyncText ms={1000} text={props.middleText} />
            </span>
            <span>
              <Text text="C" />
            </span>
          </Placeholder>
        );
      }

      // Initial mount
      ReactNoop.render(<App middleText="B" />);
      expect(ReactNoop.flush()).toEqual([
        'A',
        'Suspend! [B]',
        'C',
        'Loading...',
      ]);
      expect(ReactNoop.getChildren()).toEqual([]);
      await advanceTimers(1000);
      ReactNoop.expire(1000);
      expect(ReactNoop.flush()).toEqual(['A', 'B', 'C']);
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <Fragment>
          <span hidden={true}>A</span>
          <span>B</span>
          <span>C</span>
        </Fragment>,
      );

      // Update
      ReactNoop.render(<App middleText="B2" />);
      expect(ReactNoop.flush()).toEqual(['Suspend! [B2]', 'C', 'Loading...']);
      // Time out the update
      await advanceTimers(750);
      ReactNoop.expire(750);
      expect(ReactNoop.flush()).toEqual([]);
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <Fragment>
          <span hidden={true}>A</span>
          <span hidden={true}>B</span>
          <span hidden={true}>C</span>
          Loading...
        </Fragment>,
      );

      // Resolve the promise
      await advanceTimers(1000);
      ReactNoop.expire(1000);
      expect(ReactNoop.flush()).toEqual(['B2', 'C']);

      // Render the final update. A should still be hidden, because it was
      // given a `hidden` prop.
      expect(ReactNoop.getChildrenAsJSX()).toEqual(
        <Fragment>
          <span hidden={true}>A</span>
          <span>B2</span>
          <span>C</span>
        </Fragment>,
      );
    });

    it('times out text nodes', async () => {
      function App(props) {
        return (
          <Placeholder delayMs={500} fallback={<Text text="Loading..." />}>
            <Text text="A" />
            <AsyncText ms={1000} text={props.middleText} />
            <Text text="C" />
          </Placeholder>
        );
      }

      // Initial mount
      ReactNoop.render(<App middleText="B" />);
      expect(ReactNoop.flush()).toEqual([
        'A',
        'Suspend! [B]',
        'C',
        'Loading...',
      ]);
      expect(ReactNoop.getChildren()).toEqual([]);
      await advanceTimers(1000);
      ReactNoop.expire(1000);
      expect(ReactNoop.flush()).toEqual(['A', 'B', 'C']);
      expect(ReactNoop.getChildrenAsJSX()).toEqual('ABC');

      // Update
      ReactNoop.render(<App middleText="B2" />);
      expect(ReactNoop.flush()).toEqual([
        'A',
        'Suspend! [B2]',
        'C',
        'Loading...',
      ]);
      // Time out the update
      await advanceTimers(750);
      ReactNoop.expire(750);
      expect(ReactNoop.flush()).toEqual([]);
      expect(ReactNoop.getChildrenAsJSX()).toEqual('Loading...');

      // Resolve the promise
      await advanceTimers(1000);
      ReactNoop.expire(1000);
      expect(ReactNoop.flush()).toEqual(['A', 'B2', 'C']);

      // Render the final update. A should still be hidden, because it was
      // given a `hidden` prop.
      expect(ReactNoop.getChildrenAsJSX()).toEqual('AB2C');
    });
  });
}
