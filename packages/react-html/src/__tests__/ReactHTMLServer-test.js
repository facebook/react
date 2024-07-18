/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

global.TextDecoder = require('util').TextDecoder;
global.TextEncoder = require('util').TextEncoder;

let React;
let ReactHTML;

function normalizeCodeLocInfo(str) {
  return (
    str &&
    String(str).replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
      return '\n    in ' + name + ' (at **)';
    })
  );
}

if (!__EXPERIMENTAL__) {
  it('should not be built in stable', () => {
    try {
      require('react-html');
    } catch (x) {
      return;
    }
    throw new Error('Expected react-html not to exist in stable.');
  });
} else {
  describe('ReactHTML', () => {
    beforeEach(() => {
      jest.resetModules();
      // We run in the react-server condition.
      jest.mock('react', () => require('react/react.react-server'));
      if (__EXPERIMENTAL__) {
        jest.mock('react-html', () =>
          require('react-html/react-html.react-server'),
        );
      }

      React = require('react');
      if (__EXPERIMENTAL__) {
        ReactHTML = require('react-html');
      } else {
        try {
          require('react-html/react-html.react-server');
        } catch (x) {
          return;
        }
        throw new Error('Expected react-html not to exist in stable.');
      }
    });

    it('should be able to render a simple component', async () => {
      function Component() {
        // We can't use JSX because that's client-JSX in our tests.
        return React.createElement('div', null, 'hello world');
      }

      const html = await ReactHTML.renderToMarkup(
        React.createElement(Component),
      );
      expect(html).toBe('<div>hello world</div>');
    });

    it('should be able to render a large string', async () => {
      function Component() {
        // We can't use JSX because that's client-JSX in our tests.
        return React.createElement('div', null, 'hello '.repeat(200) + 'world');
      }

      const html = await ReactHTML.renderToMarkup(
        React.createElement(Component),
      );
      expect(html).toBe('<div>' + ('hello '.repeat(200) + 'world') + '</div>');
    });

    it('should prefix html tags with a doctype', async () => {
      const html = await ReactHTML.renderToMarkup(
        // We can't use JSX because that's client-JSX in our tests.
        React.createElement(
          'html',
          null,
          React.createElement('body', null, 'hello'),
        ),
      );
      expect(html).toBe(
        '<!DOCTYPE html><html><head></head><body>hello</body></html>',
      );
    });

    it('should error on useState', async () => {
      function Component() {
        const [state] = React.useState('hello');
        // We can't use JSX because that's client-JSX in our tests.
        return React.createElement('div', null, state);
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(React.createElement(Component));
      }).rejects.toThrow();
    });

    it('should error on refs passed to host components', async () => {
      function Component() {
        const ref = React.createRef();
        // We can't use JSX because that's client-JSX in our tests.
        return React.createElement('div', {ref});
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(React.createElement(Component));
      }).rejects.toThrow();
    });

    it('should error on callbacks passed to event handlers', async () => {
      function Component() {
        function onClick() {
          // This won't be able to be called.
        }
        // We can't use JSX because that's client-JSX in our tests.
        return React.createElement('div', {onClick});
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(React.createElement(Component));
      }).rejects.toThrow();
    });

    it('supports the useId Hook', async () => {
      function Component() {
        const firstNameId = React.useId();
        const lastNameId = React.useId();
        // We can't use JSX because that's client-JSX in our tests.
        return React.createElement(
          'div',
          null,
          React.createElement(
            'h2',
            {
              id: firstNameId,
            },
            'First',
          ),
          React.createElement(
            'p',
            {
              'aria-labelledby': firstNameId,
            },
            'Sebastian',
          ),
          React.createElement(
            'h2',
            {
              id: lastNameId,
            },
            'Last',
          ),
          React.createElement(
            'p',
            {
              'aria-labelledby': lastNameId,
            },
            'Smith',
          ),
        );
      }

      const html = await ReactHTML.renderToMarkup(
        React.createElement(Component),
      );
      const container = document.createElement('div');
      container.innerHTML = html;

      expect(container.getElementsByTagName('h2')[0].id).toBe(
        container.getElementsByTagName('p')[0].getAttribute('aria-labelledby'),
      );
      expect(container.getElementsByTagName('h2')[1].id).toBe(
        container.getElementsByTagName('p')[1].getAttribute('aria-labelledby'),
      );

      // It's not the same id between them.
      expect(container.getElementsByTagName('h2')[0].id).not.toBe(
        container.getElementsByTagName('p')[1].getAttribute('aria-labelledby'),
      );
    });

    // @gate enableCache
    it('supports cache', async () => {
      let counter = 0;
      const getCount = React.cache(() => {
        return counter++;
      });
      function Component() {
        const a = getCount();
        const b = getCount();
        return React.createElement('div', null, a, b);
      }

      const html = await ReactHTML.renderToMarkup(
        React.createElement(Component),
      );
      expect(html).toBe('<div>00</div>');
    });

    it('can get the component owner stacks for onError in dev', async () => {
      const thrownError = new Error('hi');
      const caughtErrors = [];

      function Foo() {
        return React.createElement(Bar);
      }
      function Bar() {
        return React.createElement('div', null, React.createElement(Baz));
      }
      function Baz({unused}) {
        throw thrownError;
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(
          React.createElement('div', null, React.createElement(Foo)),
          {
            onError(error, errorInfo) {
              caughtErrors.push({
                error: error,
                parentStack: errorInfo.componentStack,
                ownerStack: React.captureOwnerStack
                  ? React.captureOwnerStack()
                  : null,
              });
            },
          },
        );
      }).rejects.toThrow(thrownError);

      expect(caughtErrors.length).toBe(1);
      expect(caughtErrors[0].error).toBe(thrownError);
      expect(normalizeCodeLocInfo(caughtErrors[0].parentStack)).toBe(
        __DEV__
          ? '\n    in Baz (at **)' +
              '\n    in div (at **)' +
              '\n    in Bar (at **)' +
              '\n    in Foo (at **)' +
              '\n    in div (at **)'
          : '\n    in div (at **)' + '\n    in div (at **)',
      );
      expect(normalizeCodeLocInfo(caughtErrors[0].ownerStack)).toBe(
        __DEV__ && gate(flags => flags.enableOwnerStacks)
          ? '\n    in Bar (at **)' + '\n    in Foo (at **)'
          : null,
      );
    });
  });
}
