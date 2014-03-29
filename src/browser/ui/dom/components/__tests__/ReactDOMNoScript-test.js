/**
 * Copyright 2013-2014 Facebook, Inc.
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

"use strict";

/*jshint evil:true */

describe('ReactDOMNoScript', function() {
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should contain static markup', function() {
    var noscript = <noscript><span>one<span>two</span></span></noscript>;
    var html = React.renderComponentToString(noscript);
    expect(html).toContain('<span>one<span>two</span></span>');
  });

  it('should serialize all children', function() {
    var noscript = <noscript><span>one</span><span>two</span></noscript>;
    var html = React.renderComponentToString(noscript);
    expect(html).toContain('<span>one</span><span>two</span>');
  });

  it('should error if you pass children and dangerouslySetInnerHTML', function() {
    expect(function() {
      React.renderComponentToString(
        <noscript dangerouslySetInnerHTML={{__html:'hi'}}>hello</noscript>
      );
    }).toThrow(
      'Invariant Violation: ' +
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
    );
  });

  it('should be rendered into the DOM with a single text node child', function() {
    var container = document.createElement('div');
    var instance = <noscript><span>one</span><span>two</span></noscript>;

    instance = React.renderComponent(instance, container);

    expect(instance.getDOMNode().childNodes.length).toBe(1);
    expect(instance.getDOMNode().childNodes[0].nodeType).toBe(3);
  });
});
