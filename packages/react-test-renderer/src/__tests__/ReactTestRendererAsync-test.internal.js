/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

describe('ReactTestRendererAsync (internal)', () => {
  let React;
  let ReactFeatureFlags;
  let ReactTestRenderer;
  let SimpleCacheProvider;
  let TextResource;
  let cache;
  let resourcePromise;

  const AsyncText = ({ms, text}) => {
    try {
      TextResource.read(cache, [text, ms]);
      ReactTestRenderer.unstable_yield(`AsyncText [${text}]`);
      return text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        ReactTestRenderer.unstable_yield(`Suspend [${text}]`);
      } else {
        ReactTestRenderer.unstable_yield(`Error [${text}]`);
      }
      throw promise;
    }
  };

  const Text = ({text}) => {
    ReactTestRenderer.unstable_yield(`Text [${text}]`);
    return text;
  };

  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffects = false;
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableSuspense = true;

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');

    SimpleCacheProvider = require('simple-cache-provider');
    function invalidateCache() {
      cache = SimpleCacheProvider.createCache(invalidateCache);
    }
    invalidateCache();

    resourcePromise = null;

    TextResource = SimpleCacheProvider.createResource(([text, ms = 0]) => {
      resourcePromise = new Promise((resolve, reject) =>
        setTimeout(() => {
          ReactTestRenderer.unstable_yield(`Promise resolved [${text}]`);
          resolve(text);
        }, ms),
      );
      return resourcePromise;
    }, ([text, ms]) => text);
  });

  it('supports high priority re-renders for suspended roots', async () => {
    const Component = ({value}) => {
      ReactTestRenderer.unstable_yield(`Component [${value}]`);
      return value;
    };

    const renderer = ReactTestRenderer.create(
      <React.Fragment>
        <React.Placeholder delayMs={2000} fallback={<Text text="loading" />}>
          <AsyncText text="loaded" ms={1000} />
        </React.Placeholder>
        <Component value="initial" />
      </React.Fragment>,
      {unstable_isAsync: true},
    );
    expect(renderer).toFlushAll([
      'Suspend [loaded]',
      'Text [loading]',
      'Component [initial]',
    ]);

    // Interrupt with higher priority properties
    renderer.unstable_flushSync(() => {
      renderer.update(
        <React.Fragment>
          <React.Placeholder delayMs={2000} fallback={<Text text="loading" />}>
            <AsyncText text="loaded" ms={1000} />
          </React.Placeholder>
          <Component value="updated" />
        </React.Fragment>,
      );
    });

    // Only the higher priority properties have been committed
    expect(renderer.toJSON()).toEqual(['loading', 'updated']);

    // Finish the suspended work
    jest.advanceTimersByTime(1000);
    await resourcePromise;
    expect(renderer).toFlushAll(['AsyncText [loaded]']);

    // Ensure the correct final result has been committed
    expect(renderer.toJSON()).toEqual(['loaded', 'updated']);
  });

  it('supports high priority state updates for suspended roots', async () => {
    let instance;
    class Component extends React.Component {
      state = {value: 'initial'};
      render() {
        instance = this;
        ReactTestRenderer.unstable_yield(`Component [${this.props.value}]`);
        return this.props.value;
      }
    }

    const renderer = ReactTestRenderer.create(
      <React.Fragment>
        <React.Placeholder delayMs={2000} fallback={<Text text="loading" />}>
          <AsyncText text="loaded" ms={1000} />
        </React.Placeholder>
        <Component value="initial" />
      </React.Fragment>,
      {unstable_isAsync: true},
    );
    expect(renderer).toFlushAll([
      'Suspend [loaded]',
      'Text [loading]',
      'Component [initial]',
    ]);

    // Interrupt with higher priority properties
    renderer.unstable_flushSync(() => {
      instance.setState({value: 'updated'});
    });

    // Only the higher priority properties have been committed
    expect(renderer.toJSON()).toEqual(['loading', 'updated']);

    // Finish the suspended work
    jest.advanceTimersByTime(1000);
    await resourcePromise;
    expect(renderer).toFlushAll(['AsyncText [loaded]']);

    // Ensure the correct final result has been committed
    expect(renderer.toJSON()).toEqual(['loaded', 'updated']);
  });
});
