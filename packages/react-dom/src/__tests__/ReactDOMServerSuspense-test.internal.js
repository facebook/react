/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();

  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  ReactTestUtils = require('react-dom/test-utils');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
    ReactTestUtils,
  };
}

const {
  itThrowsWhenRendering,
  resetModules,
  serverRender,
} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerSuspense', () => {
  beforeEach(() => {
    resetModules();
  });

  function Text(props) {
    return <div>{props.text}</div>;
  }

  function AsyncText(props) {
    throw new Promise(() => {});
  }

  // @gate experimental || www
  it('should render the children when no promise is thrown', async () => {
    const c = await serverRender(
      <div>
        <React.Suspense fallback={<Text text="Fallback" />}>
          <Text text="Children" />
        </React.Suspense>
      </div>,
    );
    const e = c.children[0];

    expect(e.tagName).toBe('DIV');
    expect(e.textContent).toBe('Children');
  });

  // @gate experimental || www
  it('should render the fallback when a promise thrown', async () => {
    const c = await serverRender(
      <div>
        <React.Suspense fallback={<Text text="Fallback" />}>
          <AsyncText text="Children" />
        </React.Suspense>
      </div>,
    );
    const e = c.children[0];

    expect(e.tagName).toBe('DIV');
    expect(e.textContent).toBe('Fallback');
  });

  // @gate experimental || www
  it('should work with nested suspense components', async () => {
    const c = await serverRender(
      <div>
        <React.Suspense fallback={<Text text="Fallback" />}>
          <div>
            <Text text="Children" />
            <React.Suspense fallback={<Text text="Fallback" />}>
              <AsyncText text="Children" />
            </React.Suspense>
          </div>
        </React.Suspense>
      </div>,
    );
    const e = c.children[0];

    expect(e.innerHTML).toBe(
      '<div>Children</div><!--$!--><div>Fallback</div><!--/$-->',
    );
  });

  // @gate experimental
  it('server renders a SuspenseList component and its children', async () => {
    const example = (
      <React.SuspenseList>
        <React.Suspense fallback="Loading A">
          <div>A</div>
        </React.Suspense>
        <React.Suspense fallback="Loading B">
          <div>B</div>
        </React.Suspense>
      </React.SuspenseList>
    );
    const element = await serverRender(example);
    const parent = element.parentNode;
    const divA = parent.children[0];
    expect(divA.tagName).toBe('DIV');
    expect(divA.textContent).toBe('A');
    const divB = parent.children[1];
    expect(divB.tagName).toBe('DIV');
    expect(divB.textContent).toBe('B');

    ReactTestUtils.act(() => {
      const root = ReactDOM.createBlockingRoot(parent, {hydrate: true});
      root.render(example);
    });

    const parent2 = element.parentNode;
    const divA2 = parent2.children[0];
    const divB2 = parent2.children[1];
    expect(divA).toBe(divA2);
    expect(divB).toBe(divB2);
  });

  // TODO: Remove this in favor of @gate pragma
  if (__EXPERIMENTAL__) {
    itThrowsWhenRendering(
      'a suspending component outside a Suspense node',
      async render => {
        await render(
          <div>
            <React.Suspense />
            <AsyncText text="Children" />
            <React.Suspense />
          </div>,
          1,
        );
      },
      'Add a <Suspense fallback=...> component higher in the tree',
    );

    itThrowsWhenRendering(
      'a suspending component without a Suspense above',
      async render => {
        await render(
          <div>
            <AsyncText text="Children" />
          </div>,
          1,
        );
      },
      'Add a <Suspense fallback=...> component higher in the tree',
    );
  }

  it('does not get confused by throwing null', () => {
    function Bad() {
      // eslint-disable-next-line no-throw-literal
      throw null;
    }

    let didError;
    let error;
    try {
      ReactDOMServer.renderToString(<Bad />);
    } catch (err) {
      didError = true;
      error = err;
    }
    expect(didError).toBe(true);
    expect(error).toBe(null);
  });

  it('does not get confused by throwing undefined', () => {
    function Bad() {
      // eslint-disable-next-line no-throw-literal
      throw undefined;
    }

    let didError;
    let error;
    try {
      ReactDOMServer.renderToString(<Bad />);
    } catch (err) {
      didError = true;
      error = err;
    }
    expect(didError).toBe(true);
    expect(error).toBe(undefined);
  });

  it('does not get confused by throwing a primitive', () => {
    function Bad() {
      // eslint-disable-next-line no-throw-literal
      throw 'foo';
    }

    let didError;
    let error;
    try {
      ReactDOMServer.renderToString(<Bad />);
    } catch (err) {
      didError = true;
      error = err;
    }
    expect(didError).toBe(true);
    expect(error).toBe('foo');
  });
});
