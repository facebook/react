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
