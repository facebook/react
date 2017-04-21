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

var getTestDocument;

var testDocument;

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
    getTestDocument = require('getTestDocument');

    testDocument = getTestDocument();
  });

  it('should be able to adopt server markup', () => {
    expect(testDocument).not.toBeUndefined();

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
    testDocument = getTestDocument(markup);
    var body = testDocument.body;

    ReactDOM.render(<Root hello="world" />, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello world');

    ReactDOM.render(<Root hello="moon" />, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello moon');

    expect(body).toBe(testDocument.body);
  });

  it('should not be able to unmount component from document node', () => {
    expect(testDocument).not.toBeUndefined();

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
    testDocument = getTestDocument(markup);
    ReactDOM.render(<Root />, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello world');

    expect(function() {
      ReactDOM.unmountComponentAtNode(testDocument);
    }).toThrowError(UNMOUNT_INVARIANT_MESSAGE);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should not be able to switch root constructors', () => {
    expect(testDocument).not.toBeUndefined();

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
    testDocument = getTestDocument(markup);

    ReactDOM.render(<Component />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');

    // Reactive update
    expect(function() {
      ReactDOM.render(<Component2 />, testDocument);
    }).toThrowError(UNMOUNT_INVARIANT_MESSAGE);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should be able to mount into document', () => {
    expect(testDocument).not.toBeUndefined();

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
    testDocument = getTestDocument(markup);

    ReactDOM.render(<Component text="Hello world" />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should give helpful errors on state desync', () => {
    expect(testDocument).not.toBeUndefined();

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
    testDocument = getTestDocument(markup);

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
  });

  it('should throw on full document render w/ no markup', () => {
    expect(testDocument).not.toBeUndefined();

    var container = testDocument;

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

    expect(function() {
      ReactDOM.render(<Component />, container);
    }).toThrowError(
      "You're trying to render a component to the document but you didn't " +
        "use server rendering. We can't do this without using server " +
        'rendering due to cross-browser quirks. See ' +
        'ReactDOMServer.renderToString() for server rendering.',
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
    testDocument = getTestDocument(markup);
    var component = ReactDOM.render(tree, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello world');
    expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
  });
});
