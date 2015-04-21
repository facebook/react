/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var assign = require('Object.assign');

var React;
var ReactTestUtils;
var Component;

function makeElement(type, props, source) {
  return {
    type: type,
    key: null,
    ref: null,
    props: props,
    _store: {props: props, originalProps: assign({}, props)},
    _source: source,
    _isReactElement: true
  };
}

describe('ReactElementSource', function() {

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    Component = React.createClass({
      render: function() {
        return <div>{this.props.element}</div>;
      }
    });
  });

  // TODO: this test is removed when warnings are removed in a future version.
  it('should not warn when rendering an known element', function () {
    spyOn(console, 'error');

    var element = <div className="self">Component</div>;
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );

    expect(console.error.calls.length).toBe(0);
  });

  // TODO: this test is removed when warnings are removed in a future version.
  it('should warn when rendering an unknown element', function () {
    spyOn(console, 'error');

    var element = makeElement('div', {className: 'unknown'}, undefined);
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).toBe('unknown');
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: ' +
      'React is rendering an element from an unknown or foreign source. ' +
      'This is potentially malicious and a future version of React will ' +
      'not render this element. Call ' +
      'React.dangerouslyTrustAllSources(false) to disable rendering from ' +
      'unknown and foriegn sources.'
    );
  });

  // TODO: this test is removed when warnings are removed in a future version.
  it('should warn when rendering an foreign element', function () {
    spyOn(console, 'error');

    var element = makeElement('div', {className: 'foreign'}, 'randomstring');
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).toBe('foreign');
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: ' +
      'React is rendering an element from an unknown or foreign source. ' +
      'This is potentially malicious and a future version of React will ' +
      'not render this element. Call ' +
      'React.dangerouslyTrustAllSources(false) to disable rendering from ' +
      'unknown and foriegn sources.'
    );
  });

  it('should render an element created by itself', function() {
    spyOn(console, 'error');
    React.dangerouslyTrustAllSources(false);

    var element = <div className="self">Component</div>;
    expect(element._source).not.toBe(undefined);
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).toBe('self');
    expect(console.error.calls.length).toBe(0);
  });

  it('should not render an unknown element', function() {
    spyOn(console, 'error');
    React.dangerouslyTrustAllSources(false);

    var element = makeElement('div', {className: 'unknown'}, undefined);
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).not.toBe('unknown');
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: Any use of a keyed object should be wrapped in ' +
      'React.addons.createFragment(object) before being passed as a child.'
    );
  });

  it('should render an element created by a trusted source', function() {
    spyOn(console, 'error');
    React.trustSource('randomstring');

    var element = makeElement('div', {className: 'trusted'}, 'randomstring');
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).toBe('trusted');
    expect(console.error.calls.length).toBe(0);
  });

  it('should not render an element created by an foreign source', function() {
    spyOn(console, 'error');
    React.trustSource('randomstring');

    var element = makeElement('div', {className: 'foreign'}, 'differentrandomstring');
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).not.toBe('foreign');
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: Any use of a keyed object should be wrapped in ' +
      'React.addons.createFragment(object) before being passed as a child.'
    );
  });

  it('should render unknown element when dangerously trusting', function() {
    spyOn(console, 'error');
    React.dangerouslyTrustAllSources();

    var element = makeElement('div', {className: 'unknown'}, undefined);
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).toBe('unknown');
    expect(console.error.calls.length).toBe(0);
  });

  it('should render foreign element when dangerously trusting', function() {
    spyOn(console, 'error');
    React.dangerouslyTrustAllSources();

    var element = makeElement('div', {className: 'foreign'}, 'randomforeignstring');
    var component = ReactTestUtils.renderIntoDocument(
      <Component element={element} />
    );
    expect(React.findDOMNode(component).childNodes[0].className).toBe('foreign');
    expect(console.error.calls.length).toBe(0);
  });

});
