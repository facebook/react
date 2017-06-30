/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactDOMServer;
var ReactDOMFeatureFlags;

var getTestDocument;

var UNMOUNT_INVARIANT_MESSAGE =
  '<html> tried to unmount. ' +
  'Because of cross-browser quirks it is impossible to unmount some ' +
  'top-level components (eg <html>, <head>, and <body>) reliably and ' +
  'efficiently. To fix this, have a single top-level component that ' +
  'never unmounts render these elements.';

describe('rendering React components at document', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    getTestDocument = require('getTestDocument');
  });

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

    ReactDOM.render(<Root hello="world" />, testDocument);
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

    if (ReactDOMFeatureFlags.useFiber) {
      // In Fiber this actually works. It might not be a good idea though.
      ReactDOM.unmountComponentAtNode(testDocument);
      expect(testDocument.firstChild).toBe(null);
    } else {
      expect(function() {
        ReactDOM.unmountComponentAtNode(testDocument);
      }).toThrowError(UNMOUNT_INVARIANT_MESSAGE);

      expect(testDocument.body.innerHTML).toBe('Hello world');
    }
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

    ReactDOM.render(<Component />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');

    // Reactive update
    if (ReactDOMFeatureFlags.useFiber) {
      // This works but is probably a bad idea.
      ReactDOM.render(<Component2 />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Goodbye world');
    } else {
      expect(function() {
        ReactDOM.render(<Component2 />, testDocument);
      }).toThrowError(UNMOUNT_INVARIANT_MESSAGE);

      expect(testDocument.body.innerHTML).toBe('Hello world');
    }
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

    ReactDOM.render(<Component text="Hello world" />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('renders over an existing text child without throwing', () => {
    const container = document.createElement('div');
    container.textContent = 'potato';
    ReactDOM.render(<div>parsnip</div>, container);
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

    if (ReactDOMFeatureFlags.useFiber) {
      spyOn(console, 'error');
      ReactDOM.render(<Component text="Hello world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Text content did not match.',
      );
    } else {
      expect(function() {
        // Notice the text is different!
        ReactDOM.render(<Component text="Hello world" />, testDocument);
      }).toThrowError(
        "You're trying to render a component to the document using " +
          'server rendering but the checksum was invalid. This usually ' +
          'means you rendered a different component type or props on ' +
          'the client from the one on the server, or your render() methods ' +
          'are impure. React cannot handle this case due to cross-browser ' +
          'quirks by rendering at the document root. You should look for ' +
          'environment dependent code in your components and ensure ' +
          'the props are the same client and server side:\n' +
          ' (client) dy data-reactid="4">Hello world</body></\n' +
          ' (server) dy data-reactid="4">Goodbye world</body>',
      );
    }
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

    if (ReactDOMFeatureFlags.useFiber) {
      ReactDOM.render(<Component text="Hello world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
    } else {
      expect(function() {
        ReactDOM.render(<Component />, testDocument);
      }).toThrowError(
        "You're trying to render a component to the document but you didn't " +
          "use server rendering. We can't do this without using server " +
          'rendering due to cross-browser quirks. See ' +
          'ReactDOMServer.renderToString() for server rendering.',
      );
    }
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
    var component = ReactDOM.render(tree, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello world');
    expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
  });
});
