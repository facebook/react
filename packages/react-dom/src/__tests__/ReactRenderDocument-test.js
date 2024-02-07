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
let ReactDOM;
let ReactDOMClient;
let ReactDOMServer;
let act;
let Scheduler;
let assertLog;

function getTestDocument(markup) {
  const doc = document.implementation.createHTMLDocument('');
  doc.open();
  doc.write(
    markup ||
      '<!doctype html><html><meta charset=utf-8><title>test doc</title>',
  );
  doc.close();
  return doc;
}

describe('rendering React components at document', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    Scheduler = require('scheduler');
  });

  describe('with new explicit hydration API', () => {
    it('should be able to adopt server markup', async () => {
      class Root extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{'Hello ' + this.props.hello}</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(<Root hello="world" />);
      expect(markup).not.toContain('DOCTYPE');
      const testDocument = getTestDocument(markup);
      const body = testDocument.body;

      let root;
      await act(() => {
        root = ReactDOMClient.hydrateRoot(testDocument, <Root hello="world" />);
      });
      expect(testDocument.body.innerHTML).toBe('Hello world');

      await act(() => {
        root.render(<Root hello="moon" />);
      });
      expect(testDocument.body.innerHTML).toBe('Hello moon');

      expect(body === testDocument.body).toBe(true);
    });

    it('should be able to unmount component from document node, but leaves singleton nodes intact', async () => {
      class Root extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>Hello world</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(<Root />);
      const testDocument = getTestDocument(markup);
      let root;
      await act(() => {
        root = ReactDOMClient.hydrateRoot(testDocument, <Root />);
      });
      expect(testDocument.body.innerHTML).toBe('Hello world');

      const originalDocEl = testDocument.documentElement;
      const originalHead = testDocument.head;
      const originalBody = testDocument.body;

      // When we unmount everything is removed except the singleton nodes of html, head, and body
      root.unmount();
      expect(testDocument.firstChild).toBe(originalDocEl);
      expect(testDocument.head).toBe(originalHead);
      expect(testDocument.body).toBe(originalBody);
      expect(originalBody.firstChild).toEqual(null);
      expect(originalHead.firstChild).toEqual(null);
    });

    it('should not be able to switch root constructors', async () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>Hello world</body>
            </html>
          );
        }
      }

      class Component2 extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>Goodbye world</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(<Component />);
      const testDocument = getTestDocument(markup);

      let root;
      await act(() => {
        root = ReactDOMClient.hydrateRoot(testDocument, <Component />);
      });

      expect(testDocument.body.innerHTML).toBe('Hello world');

      await act(() => {
        root.render(<Component2 />);
      });

      expect(testDocument.body.innerHTML).toBe('Goodbye world');
    });

    it('should be able to mount into document', async () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{this.props.text}</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(
        <Component text="Hello world" />,
      );
      const testDocument = getTestDocument(markup);

      await act(() => {
        ReactDOMClient.hydrateRoot(
          testDocument,
          <Component text="Hello world" />,
        );
      });

      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('cannot render over an existing text child at the root', async () => {
      const container = document.createElement('div');
      container.textContent = 'potato';

      expect(() => {
        ReactDOM.flushSync(() => {
          ReactDOMClient.hydrateRoot(container, <div>parsnip</div>, {
            onRecoverableError: error => {
              Scheduler.log('Log recoverable error: ' + error.message);
            },
          });
        });
      }).toErrorDev(
        [
          'Warning: An error occurred during hydration. The server HTML was replaced with client content in <div>.',
          'Expected server HTML to contain a matching <div> in <div>.',
        ],
        {withoutStack: 1},
      );

      assertLog([
        'Log recoverable error: Hydration failed because the initial UI does not match what was rendered on the server.',
        'Log recoverable error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);

      // This creates an unfortunate double text case.
      expect(container.textContent).toBe('parsnip');
    });

    it('renders over an existing nested text child without throwing', async () => {
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.textContent = 'potato';
      container.appendChild(wrapper);
      expect(() => {
        ReactDOM.flushSync(() => {
          ReactDOMClient.hydrateRoot(
            container,
            <div>
              <div>parsnip</div>
            </div>,
            {
              onRecoverableError: error => {
                Scheduler.log('Log recoverable error: ' + error.message);
              },
            },
          );
        });
      }).toErrorDev(
        [
          'Warning: An error occurred during hydration. The server HTML was replaced with client content in <div>.',
          'Expected server HTML to contain a matching <div> in <div>.',
        ],
        {withoutStack: 1},
      );

      assertLog([
        'Log recoverable error: Hydration failed because the initial UI does not match what was rendered on the server.',
        'Log recoverable error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
      expect(container.textContent).toBe('parsnip');
    });

    it('should give helpful errors on state desync', async () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{this.props.text}</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(
        <Component text="Goodbye world" />,
      );
      const testDocument = getTestDocument(markup);

      const enableClientRenderFallbackOnTextMismatch = gate(
        flags => flags.enableClientRenderFallbackOnTextMismatch,
      );
      expect(() => {
        ReactDOM.flushSync(() => {
          ReactDOMClient.hydrateRoot(
            testDocument,
            <Component text="Hello world" />,
            {
              onRecoverableError: error => {
                Scheduler.log('Log recoverable error: ' + error.message);
              },
            },
          );
        });
      }).toErrorDev(
        enableClientRenderFallbackOnTextMismatch
          ? [
              'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
              'Warning: Text content did not match.',
            ]
          : ['Warning: Text content did not match.'],
        {
          withoutStack: enableClientRenderFallbackOnTextMismatch ? 1 : 0,
        },
      );

      assertLog(
        enableClientRenderFallbackOnTextMismatch
          ? [
              'Log recoverable error: Text content does not match server-rendered HTML.',
              'Log recoverable error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
            ]
          : [],
      );
      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('should render w/ no markup to full document', async () => {
      const testDocument = getTestDocument();

      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{this.props.text}</body>
            </html>
          );
        }
      }

      if (gate(flags => flags.enableFloat)) {
        // with float the title no longer is a hydration mismatch so we get an error on the body mismatch
        expect(() => {
          ReactDOM.flushSync(() => {
            ReactDOMClient.hydrateRoot(
              testDocument,
              <Component text="Hello world" />,
              {
                onRecoverableError: error => {
                  Scheduler.log('Log recoverable error: ' + error.message);
                },
              },
            );
          });
        }).toErrorDev(
          [
            'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
            'Expected server HTML to contain a matching text node for "Hello world" in <body>',
          ],
          {withoutStack: 1},
        );
        assertLog([
          'Log recoverable error: Hydration failed because the initial UI does not match what was rendered on the server.',
          'Log recoverable error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
        ]);
      } else {
        // getTestDocument() has an extra <meta> that we didn't render.
        expect(() => {
          ReactDOM.flushSync(() => {
            ReactDOMClient.hydrateRoot(
              testDocument,
              <Component text="Hello world" />,
              {
                onRecoverableError: error => {
                  Scheduler.log('Log recoverable error: ' + error.message);
                },
              },
            );
          });
        }).toErrorDev(
          [
            'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
            'Warning: Text content did not match. Server: "test doc" Client: "Hello World"',
          ],
          {withoutStack: 1},
        );
        assertLog([
          'Log recoverable error: Text content does not match server-rendered HTML.',
          'Log recoverable error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
        ]);
      }
      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('supports findDOMNode on full-page components in legacy mode', () => {
      const tree = (
        <html>
          <head>
            <title>Hello World</title>
          </head>
          <body>Hello world</body>
        </html>
      );

      const markup = ReactDOMServer.renderToString(tree);
      const testDocument = getTestDocument(markup);
      const component = ReactDOM.hydrate(tree, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
    });
  });
});
