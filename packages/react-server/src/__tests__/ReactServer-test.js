/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let act;
let React;
let ReactNoopServer;

function normalizeCodeLocInfo(str) {
  return (
    str &&
    str.replace(/^ +(?:at|in) ([\S]+)[^\n]*/gm, function (m, name) {
      const dot = name.lastIndexOf('.');
      if (dot !== -1) {
        name = name.slice(dot + 1);
      }
      return '    in ' + name + (/\d/.test(m) ? ' (at **)' : '');
    })
  );
}

describe('ReactServer', () => {
  beforeEach(() => {
    jest.resetModules();

    act = require('internal-test-utils').act;
    React = require('react');
    ReactNoopServer = require('react-noop-renderer/server');
  });

  function div(...children) {
    children = children.map(c =>
      typeof c === 'string' ? {text: c, hidden: false} : c,
    );
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  it('can call render', () => {
    const result = ReactNoopServer.render(<div>hello world</div>);
    expect(result.root).toEqual(div('hello world'));
  });

  it('has Owner Stacks in DEV when aborted', async () => {
    function Component({promise}) {
      React.use(promise);
      return <div>Hello, Dave!</div>;
    }
    function App({promise}) {
      return <Component promise={promise} />;
    }

    let caughtError;
    let componentStack;
    let ownerStack;
    const result = ReactNoopServer.render(
      <App promise={new Promise(() => {})} />,
      {
        onError: (error, errorInfo) => {
          caughtError = error;
          componentStack = errorInfo.componentStack;
          ownerStack = __DEV__ ? React.captureOwnerStack() : null;
        },
      },
    );

    await act(async () => {
      result.abort();
    });
    expect(caughtError).toEqual(
      expect.objectContaining({
        message: 'The render was aborted by the server without a reason.',
      }),
    );
    expect(normalizeCodeLocInfo(componentStack)).toEqual(
      '\n    in Component (at **)' + '\n    in App (at **)',
    );
    expect(normalizeCodeLocInfo(ownerStack)).toEqual(
      __DEV__ ? '\n    in App (at **)' : null,
    );
  });
});
