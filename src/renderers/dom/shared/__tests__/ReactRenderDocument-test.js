/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactDOMServer;

var getTestDocument;

describe('rendering React components at document', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    getTestDocument = require('getTestDocument');
  });

  describe('with old implicit hydration API', () => {
    function expectDeprecationWarningWithFiber() {
      expectDev(console.warn.calls.count()).toBe(1);
      expectDev(console.warn.calls.argsFor(0)[0]).toContain(
        'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
          'will stop working in React v17. Replace the ReactDOM.render() call ' +
          'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
      );
    }

    it('should be able to adopt server markup', () => {
      spyOn(console, 'warn');
      class Root extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                {'Hello ' + this.props.hello}
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(<Root hello="world" />);
      var testDocument = getTestDocument(markup);
      var body = testDocument.body;

      ReactDOM.render(<Root hello="world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      ReactDOM.render(<Root hello="moon" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello moon');

      expect(body === testDocument.body).toBe(true);
      expectDeprecationWarningWithFiber();
    });

    it('should not be able to unmount component from document node', () => {
      spyOn(console, 'warn');
      class Root extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                Hello world
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(<Root />);
      var testDocument = getTestDocument(markup);
      ReactDOM.render(<Root />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      // In Fiber this actually works. It might not be a good idea though.
      ReactDOM.unmountComponentAtNode(testDocument);
      expect(testDocument.firstChild).toBe(null);

      expectDeprecationWarningWithFiber();
    });

    it('should not be able to switch root constructors', () => {
      spyOn(console, 'warn');
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                Hello world
              </body>
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
              <body>
                Goodbye world
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(<Component />);
      var testDocument = getTestDocument(markup);

      ReactDOM.render(<Component />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      // This works but is probably a bad idea.
      ReactDOM.render(<Component2 />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Goodbye world');
      expectDeprecationWarningWithFiber();
    });

    it('should be able to mount into document', () => {
      spyOn(console, 'warn');
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                {this.props.text}
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(
        <Component text="Hello world" />,
      );
      var testDocument = getTestDocument(markup);

      ReactDOM.render(<Component text="Hello world" />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Hello world');
      expectDeprecationWarningWithFiber();
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
              <body>
                {this.props.text}
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(
        <Component text="Goodbye world" />,
      );
      var testDocument = getTestDocument(markup);

      spyOn(console, 'warn');
      spyOn(console, 'error');
      ReactDOM.render(<Component text="Hello world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expectDev(console.warn.calls.count()).toBe(1);
      expectDev(console.warn.calls.argsFor(0)[0]).toContain(
        'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
          'will stop working in React v17. Replace the ReactDOM.render() call ' +
          'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
      );
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Text content did not match.',
      );
    });

    it('should throw on full document render w/ no markup', () => {
      var testDocument = getTestDocument();

      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                {this.props.text}
              </body>
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
      spyOn(console, 'warn');
      var tree = (
        <html>
          <head>
            <title>Hello World</title>
          </head>
          <body>
            Hello world
          </body>
        </html>
      );

      var markup = ReactDOMServer.renderToString(tree);
      var testDocument = getTestDocument(markup);
      var component = ReactDOM.render(tree, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
      expectDeprecationWarningWithFiber();
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
              <body>
                {'Hello ' + this.props.hello}
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(<Root hello="world" />);
      var testDocument = getTestDocument(markup);
      var body = testDocument.body;

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
              <body>
                Hello world
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(<Root />);
      var testDocument = getTestDocument(markup);
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
              <body>
                Hello world
              </body>
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
              <body>
                Goodbye world
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(<Component />);
      var testDocument = getTestDocument(markup);

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
              <body>
                {this.props.text}
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(
        <Component text="Hello world" />,
      );
      var testDocument = getTestDocument(markup);

      ReactDOM.hydrate(<Component text="Hello world" />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('renders over an existing text child without throwing', () => {
      spyOn(console, 'error');
      const container = document.createElement('div');
      container.textContent = 'potato';
      ReactDOM.hydrate(<div>parsnip</div>, container);
      expect(container.textContent).toBe('parsnip');
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Expected server HTML to contain a matching <div> in <div>.',
      );
    });

    it('should give helpful errors on state desync', () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                {this.props.text}
              </body>
            </html>
          );
        }
      }

      var markup = ReactDOMServer.renderToString(
        <Component text="Goodbye world" />,
      );
      var testDocument = getTestDocument(markup);

      spyOn(console, 'error');
      ReactDOM.hydrate(<Component text="Hello world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Text content did not match.',
      );
    });

    it('should render w/ no markup to full document', () => {
      spyOn(console, 'error');
      var testDocument = getTestDocument();

      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>
                {this.props.text}
              </body>
            </html>
          );
        }
      }

      ReactDOM.hydrate(<Component text="Hello world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        // getTestDocument() has an extra <meta> that we didn't render.
        'Did not expect server HTML to contain a <meta> in <head>.',
      );
    });

    it('supports findDOMNode on full-page components', () => {
      var tree = (
        <html>
          <head>
            <title>Hello World</title>
          </head>
          <body>
            Hello world
          </body>
        </html>
      );

      var markup = ReactDOMServer.renderToString(tree);
      var testDocument = getTestDocument(markup);
      var component = ReactDOM.hydrate(tree, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
    });
  });
});
