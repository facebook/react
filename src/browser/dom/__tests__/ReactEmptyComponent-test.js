/**
 * Copyright 2014 Facebook, Inc.
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

describe('ReactEmptyComponent', function() {
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should render an empty component as an empty noscript tag', function() {
    var EmptyComponent = React.EmptyComponent;
    var component = <EmptyComponent />;
    var node = ReactTestUtils.renderIntoDocument(component).getDOMNode();
    expect(node.tagName).toBe('NOSCRIPT');
  });

  it('should throw when children are passed into it', function() {
    var EmptyComponent = React.EmptyComponent;
    var component = <EmptyComponent>Hello</EmptyComponent>;
    expect(function() {
      ReactTestUtils.renderIntoDocument(component);
    }).toThrow(
      'Invariant Violation: ReactEmptyComponent: passing children into this ' +
      'component doesn\'t make sense.'
    );
  });
});
