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

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var ReactErrorUtils = require('ReactErrorUtils');

describe('ReactCompositeComponent-error', function() {

  it('should be passed the component and method name', function() {
    spyOn(ReactErrorUtils, 'guard');
    var Component = React.createClass({
      someHandler: function() {},
      render: function() {
        return <div />;
      }
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(ReactErrorUtils.guard.mostRecentCall.args[1])
      .toEqual('Component.someHandler');
  });

});
