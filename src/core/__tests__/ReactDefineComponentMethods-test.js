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
var ReactTestUtils;

describe('ReactDefineComponentMethods', function() {
  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should define new method "getNewMethodData" with policy "DEFINE_MANY_MERGED" and return merged result of functions used on ReactComponent', function() {
    React.defineComponentMethod('getNewMethodData', 'DEFINE_MANY_MERGED');

    var DefineManyMergedComponentMixin = {
      getNewMethodData: function() {
        return {
          test2: true
        }
      }
    };

    var DefineManyMergedComponent = React.createClass({
      mixins: [DefineManyMergedComponentMixin],
      getNewMethodData: function() {
        return {
          test1: true
        };
      },
      render: function() {
        return (
          <div></div>
          );
      }
    });

    var instance = <DefineManyMergedComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.getNewMethodData()).not.toBe({test1: true, test2: true});
  });

  it ('should throw an error if you try to redefine standard React component method', function() {
    expect(function() {
      React.defineMethod('getInitialState', 'DEFINE_MANY');
    }).toThrow();
  });

  it ('should throw an error if you specify nonexistent policy for a new method', function() {
    expect(function() {
      React.defineMethod('getNewMethod', 'DEFINE_NONEXISTENT');
    }).toThrow();
  });

});