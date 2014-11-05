/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

var React;
var ReactMount;

var getTestDocument;

var testDocument;

var UNMOUNT_INVARIANT_MESSAGE =
  'Invariant Violation: ReactFullPageComponenthtml tried to unmount. ' +
  'Because of cross-browser quirks it is impossible to unmount some ' +
  'top-level components (eg <html>, <head>, and <body>) reliably and ' +
  'efficiently. To fix this, have a single top-level component that ' +
  'never unmounts render these elements.';

describe('rendering React components at document', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactMount = require('ReactMount');
    getTestDocument = require('getTestDocument');

    testDocument = getTestDocument();
  });

  it('should be able to get root component id for document node', function() {
    expect(testDocument).not.toBeUndefined();

    var Root = React.createClass({
      render: function() {
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
    });

    var markup = React.renderToString(<Root />);
    testDocument = getTestDocument(markup);
    var component = React.render(<Root />, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello world');

    var componentID = ReactMount.getReactRootID(testDocument);
    expect(componentID).toBe(component._rootNodeID);
  });

  it('should not be able to unmount component from document node', function() {
    expect(testDocument).not.toBeUndefined();

    var Root = React.createClass({
      render: function() {
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
    });

    var markup = React.renderToString(<Root />);
    testDocument = getTestDocument(markup);
    React.render(<Root />, testDocument);
    expect(testDocument.body.innerHTML).toBe('Hello world');

    expect(function() {
      React.unmountComponentAtNode(testDocument);
    }).toThrow(UNMOUNT_INVARIANT_MESSAGE);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should not be able to switch root constructors', function() {
    expect(testDocument).not.toBeUndefined();

    var Component = React.createClass({
      render: function() {
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
    });

    var Component2 = React.createClass({
      render: function() {
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
    });

    var markup = React.renderToString(<Component />);
    testDocument = getTestDocument(markup);

    React.render(<Component />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');

    // Reactive update
    expect(function() {
      React.render(<Component2 />, testDocument);
    }).toThrow(UNMOUNT_INVARIANT_MESSAGE);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should be able to mount into document', function() {
    expect(testDocument).not.toBeUndefined();

    var Component = React.createClass({
      render: function() {
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
    });

    var markup = React.renderToString(
      <Component text="Hello world" />
    );
    testDocument = getTestDocument(markup);

    React.render(<Component text="Hello world" />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should give helpful errors on state desync', function() {
    expect(testDocument).not.toBeUndefined();

    var Component = React.createClass({
      render: function() {
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
    });

    var markup = React.renderToString(
      <Component text="Goodbye world" />
    );
    testDocument = getTestDocument(markup);

    expect(function() {
      // Notice the text is different!
      React.render(<Component text="Hello world" />, testDocument);
    }).toThrow(
      'Invariant Violation: ' +
      'You\'re trying to render a component to the document using ' +
      'server rendering but the checksum was invalid. This usually ' +
      'means you rendered a different component type or props on ' +
      'the client from the one on the server, or your render() methods ' +
      'are impure. React cannot handle this case due to cross-browser ' +
      'quirks by rendering at the document root. You should look for ' +
      'environment dependent code in your components and ensure ' +
      'the props are the same client and server side.'
    );
  });

  it('should throw on full document render w/ no markup', function() {
    expect(testDocument).not.toBeUndefined();

    var container = testDocument;

    var Component = React.createClass({
      render: function() {
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
    });

    expect(function() {
      React.render(<Component />, container);
    }).toThrow(
      'Invariant Violation: You\'re trying to render a component to the ' +
      'document but you didn\'t use server rendering. We can\'t do this ' +
      'without using server rendering due to cross-browser quirks. See ' +
      'renderComponentToString() for server rendering.'
    );
  });

});
