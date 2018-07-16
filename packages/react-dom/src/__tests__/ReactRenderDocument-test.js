/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactDOMServer;

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
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  describe('with old implicit hydration API', () => {
    function expectDeprecationWarningWithFiber(callback) {
      expect(callback).toLowPriorityWarnDev(
        'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
          'will stop working in React v17. Replace the ReactDOM.render() call ' +
          'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
        {withoutStack: true},
      );
    }

    it('should be able to adopt server markup', () => {
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
      const testDocument = getTestDocument(markup);
      const body = testDocument.body;

      expectDeprecationWarningWithFiber(() =>
        ReactDOM.render(<Root hello="world" />, testDocument),
      );
      expect(testDocument.body.innerHTML).toBe('Hello world');

      ReactDOM.render(<Root hello="moon" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello moon');

      expect(body === testDocument.body).toBe(true);
    });

    it('should not be able to unmount component from document node', () => {
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
      expectDeprecationWarningWithFiber(() =>
        ReactDOM.render(<Root />, testDocument),
      );
      expect(testDocument.body.innerHTML).toBe('Hello world');

      // In Fiber this actually works. It might not be a good idea though.
      ReactDOM.unmountComponentAtNode(testDocument);
      expect(testDocument.firstChild).toBe(null);
    });

    it('should not be able to switch root constructors', () => {
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

      expectDeprecationWarningWithFiber(() =>
        ReactDOM.render(<Component />, testDocument),
      );
      expect(testDocument.body.innerHTML).toBe('Hello world');

      // This works but is probably a bad idea.
      ReactDOM.render(<Component2 />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Goodbye world');
    });

    it('should be able to mount into document', () => {
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

      expectDeprecationWarningWithFiber(() =>
        ReactDOM.render(<Component text="Hello world" />, testDocument),
      );

      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('renders over an existing text child without throwing', () => {
      const container = document.createElement('div');
      container.textContent = 'potato';
      ReactDOM.render(<div>parsnip</div>, container);
      expect(container.textContent).toBe('parsnip');
      // We don't expect a warning about new hydration API here because
      // we aren't sure if the user meant to hydrate or replace a stub node.
      // We would see a warning if the container had React-rendered HTML in it.
    });

    it('should give helpful errors on state desync', () => {
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

      expect(() => {
        expect(() =>
          ReactDOM.render(<Component text="Hello world" />, testDocument),
        ).toLowPriorityWarnDev(
          'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
            'will stop working in React v17. Replace the ReactDOM.render() call ' +
            'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
          {withoutStack: true},
        );
      }).toWarnDev('Warning: Text content did not match.', {
        withoutStack: true,
      });
    });

    it('should throw on full document render w/ no markup', () => {
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

      ReactDOM.render(<Component text="Hello world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      // We don't expect a warning about new hydration API here because
      // we aren't sure if the user meant to hydrate or replace the document.
      // We would see a warning if the document had React-rendered HTML in it.
    });

    it('supports findDOMNode on full-page components', () => {
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
      let component;
      expectDeprecationWarningWithFiber(() => {
        component = ReactDOM.render(tree, testDocument);
      });
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
    });
  });

  describe('with new explicit hydration API', () => {
    it('should be able to adopt server markup', () => {
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
      const testDocument = getTestDocument(markup);
      const body = testDocument.body;

      ReactDOM.hydrate(<Root hello="world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      ReactDOM.hydrate(<Root hello="moon" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello moon');

      expect(body === testDocument.body).toBe(true);
    });

    it('should not be able to unmount component from document node', () => {
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
      ReactDOM.hydrate(<Root />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      // In Fiber this actually works. It might not be a good idea though.
      ReactDOM.unmountComponentAtNode(testDocument);
      expect(testDocument.firstChild).toBe(null);
    });

    it('should not be able to switch root constructors', () => {
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

      ReactDOM.hydrate(<Component />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Hello world');

      // This works but is probably a bad idea.
      ReactDOM.hydrate(<Component2 />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Goodbye world');
    });

    it('should be able to mount into document', () => {
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

      ReactDOM.hydrate(<Component text="Hello world" />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('renders over an existing text child without throwing', () => {
      const container = document.createElement('div');
      container.textContent = 'potato';
      expect(() => ReactDOM.hydrate(<div>parsnip</div>, container)).toWarnDev(
        'Expected server HTML to contain a matching <div> in <div>.',
        {withoutStack: true},
      );
      expect(container.textContent).toBe('parsnip');
    });

    it('should give helpful errors on state desync', () => {
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

      expect(() =>
        ReactDOM.hydrate(<Component text="Hello world" />, testDocument),
      ).toWarnDev('Warning: Text content did not match.', {
        withoutStack: true,
      });
      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('should render w/ no markup to full document', () => {
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

      // getTestDocument() has an extra <meta> that we didn't render.
      expect(() =>
        ReactDOM.hydrate(<Component text="Hello world" />, testDocument),
      ).toWarnDev('Did not expect server HTML to contain a <meta> in <head>.', {
        withoutStack: true,
      });
      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('supports findDOMNode on full-page components', () => {
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
