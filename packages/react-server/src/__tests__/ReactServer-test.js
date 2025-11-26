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
    str
      .split('\n')
      .filter(frame => {
        // These frames should be ignore-listed since they point into
        // React internals i.e. node_modules.
        return (
          frame.indexOf('ReactFizzHooks') === -1 &&
          frame.indexOf('ReactFizzThenable') === -1 &&
          frame.indexOf('ReactHooks') === -1
        );
      })
      .join('\n')
      .replace(/^ +(?:at|in) ([\S]+)[^\n]*/gm, function (m, name) {
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
    const Context = React.createContext(null);

    function Component({promise}) {
      const context = React.use(Context);
      if (context === null) {
        throw new Error('Missing context');
      }
      React.use(promise);
      return <div>Hello, Dave!</div>;
    }
    function Indirection({promise}) {
      return (
        <div>
          <Component promise={promise} />
        </div>
      );
    }
    function App({promise}) {
      return (
        <section>
          <div>
            <Indirection promise={promise} />
          </div>
        </section>
      );
    }

    let caughtError;
    let componentStack;
    let ownerStack;
    const result = ReactNoopServer.render(
      <Context value="provided">
        <App promise={new Promise(() => {})} />
      </Context>,
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
      '\n    in Component (at **)' +
        '\n    in div' +
        '\n    in Indirection (at **)' +
        '\n    in div' +
        '\n    in section' +
        '\n    in App (at **)',
    );
    if (__DEV__) {
      if (gate(flags => flags.enableAsyncDebugInfo)) {
        expect(normalizeCodeLocInfo(ownerStack)).toEqual(
          '' +
            '\n    in Component (at **)' +
            '\n    in Indirection (at **)' +
            '\n    in App (at **)',
        );
      } else {
        expect(normalizeCodeLocInfo(ownerStack)).toEqual(
          '' + '\n    in Indirection (at **)' + '\n    in App (at **)',
        );
      }
    } else {
      expect(ownerStack).toBeNull();
    }
  });
});
