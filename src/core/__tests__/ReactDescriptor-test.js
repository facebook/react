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

var React;
var ReactDescriptor;

describe('ReactDescriptor', function() {
  beforeEach(function() {
    React = require('React');
    ReactDescriptor = require('ReactDescriptor');
  });

  it('should identify valid descriptors correctly', function() {
    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });

    expect(ReactDescriptor.isValidDescriptor(<div />)).toEqual(true);
    expect(ReactDescriptor.isValidDescriptor(<Component />)).toEqual(true);

    expect(ReactDescriptor.isValidDescriptor(null)).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor(true)).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor({})).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor("string")).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor(React.DOM.div)).toEqual(false);
    expect(ReactDescriptor.isValidDescriptor(Component)).toEqual(false);
  });

  it('immediately calls the type passed to createDescriptor', function() {
    var a = 1, b = 2, c = 3, d = 4;

    // TODO: Switch back to using jest.genMockFunction when we run jest in
    // github repo.
    var test = {
      foo: function() { return d; }
    };

    spyOn(test, 'foo').andCallThrough();

    var result = React.createDescriptor(test.foo, a, b, c);

    expect(result).toBe(d);
    expect(test.foo).toHaveBeenCalledWith(a, b, c);
  });

  it('allows the use of PropTypes validators in statics', function() {
    var Component = React.createClass({
      render: () => null,
      statics: {
        specialType: React.PropTypes.shape({monkey: React.PropTypes.any})
      }
    });

    expect(typeof Component.specialType).toBe("function");
    expect(typeof Component.specialType.isRequired).toBe("function");
  });

});
