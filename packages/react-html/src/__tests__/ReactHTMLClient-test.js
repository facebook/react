/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactHTML;

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
      React = require('react');
      ReactHTML = require('react-html');
    });

    it('should be able to render a simple component', async () => {
      function Component() {
        return <div>hello world</div>;
      }

      const html = await ReactHTML.renderToMarkup(<Component />);
      expect(html).toBe('<div>hello world</div>');
    });

    it('should be able to render a large string', async () => {
      function Component() {
        return <div>{'hello '.repeat(200)}world</div>;
      }

      const html = await ReactHTML.renderToMarkup(
        React.createElement(Component),
      );
      expect(html).toBe('<div>' + ('hello '.repeat(200) + 'world') + '</div>');
    });

    it('should prefix html tags with a doctype', async () => {
      const html = await ReactHTML.renderToMarkup(
        <html>
          <body>hello</body>
        </html>,
      );
      expect(html).toBe(
        '<!DOCTYPE html><html><head></head><body>hello</body></html>',
      );
    });

    it('should error on useState', async () => {
      function Component() {
        const [state] = React.useState('hello');
        return <div>{state}</div>;
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(<Component />);
      }).rejects.toThrow();
    });

    it('should error on refs passed to host components', async () => {
      function Component() {
        const ref = React.createRef();
        return <div ref={ref} />;
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(<Component />);
      }).rejects.toThrow();
    });

    it('should error on callbacks passed to event handlers', async () => {
      function Component() {
        function onClick() {
          // This won't be able to be called.
        }
        return <div onClick={onClick} />;
      }

      await expect(async () => {
        await ReactHTML.renderToMarkup(<Component />);
      }).rejects.toThrow();
    });

    it('supports the useId Hook', async () => {
      function Component() {
        const firstNameId = React.useId();
        const lastNameId = React.useId();
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

      const html = await ReactHTML.renderToMarkup(<Component />);
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

    // @gate disableClientCache
    it('does NOT support cache yet because it is a client component', async () => {
      let counter = 0;
      const getCount = React.cache(() => {
        return counter++;
      });
      function Component() {
        const a = getCount();
        const b = getCount();
        return (
          <div>
            {a}
            {b}
          </div>
        );
      }

      const html = await ReactHTML.renderToMarkup(<Component />);
      expect(html).toBe('<div>01</div>');
    });
  });
}
