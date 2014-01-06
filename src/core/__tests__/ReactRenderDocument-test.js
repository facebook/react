/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

var React;
var ReactMount;

var getTestDocument;

var testDocument;

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

    ReactMount.allowFullPageRender = true;
    var component = React.renderComponent(<Root />, testDocument);
    expect(testDocument.body.innerHTML).toBe(' Hello world ');

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

    ReactMount.allowFullPageRender = true;
    React.renderComponent(<Root />, testDocument);
    expect(testDocument.body.innerHTML).toBe(' Hello world ');

    expect(function() {
      React.unmountComponentAtNode(testDocument);
    }).toThrow(
      'Invariant Violation: ReactFullPageComponenthtml tried to unmount. ' +
      'Because of cross-browser quirks it is impossible to unmount some ' +
      'top-level components (eg <html>, <head>,  and <body>) reliably and ' +
      'efficiently. To fix this, have a single top-level component that ' +
      'never unmounts render these elements.'
    );
    expect(testDocument.body.innerHTML).toBe(' Hello world ');
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

    ReactMount.allowFullPageRender = true;
    React.renderComponent(<Component />, testDocument);

    expect(testDocument.body.innerHTML).toBe(' Hello world ');

    // Reactive update
    expect(function() {
      React.renderComponent(<Component2 />, testDocument);
    }).toThrow(
      'Invariant Violation: ReactFullPageComponenthtml tried to unmount. ' +
      'Because of cross-browser quirks it is impossible to unmount some ' +
      'top-level components (eg <html>, <head>,  and <body>) reliably and ' +
      'efficiently. To fix this, have a single  top-level component that ' +
      'never unmounts render these elements.'
    );

    expect(testDocument.body.innerHTML).toBe(' Hello world ');

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
    ReactMount.allowFullPageRender = true;
    React.renderComponent(<Component text="Hello world" />, testDocument);

    expect(testDocument.body.innerHTML).toBe('Hello world');
  });

  it('should throw on full document render', function() {
    expect(testDocument).not.toBeUndefined();

    var container = testDocument;
    expect(function() {
      React.renderComponent(<html />, container);
    }).toThrow(
      'Invariant Violation: mountComponentIntoNode(...): Target container is ' +
      'not valid.'
    );
    ReactMount.allowFullPageRender = true;
    expect(function() {
      React.renderComponent(<html />, container);
    }).not.toThrow();
  });

  it('should throw on full document render of non-html', function() {
    expect(testDocument).not.toBeUndefined();

    var container = testDocument;
    ReactMount.allowFullPageRender = true;
    expect(function() {
      React.renderComponent(<div />, container);
    }).toThrow(
      'Invariant Violation: mutateHTMLNodeWithMarkup(): ' +
        'markup must start with <html'
    );
  });

});
