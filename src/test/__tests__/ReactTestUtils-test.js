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

"use strict";

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');

describe('ReactTestUtils', function() {
  describe('nextUpdate', function() {

    var oldDidFire = false;
    var newDidFire = false;

    var TestComponent = React.createClass({
      componentDidUpdate: function() {
        oldDidFire = true;
      },
      render: function() {
        return <div className="foo" />;
      }
    });

    beforeEach(function() {
      oldDidFire = false;
      newDidFire = false;
    });

    it("registers a new chained callback on a composite component", function() {
      var root = ReactTestUtils.renderIntoDocument(<TestComponent />);
      var component = ReactTestUtils.findRenderedComponentWithType(root, TestComponent);

      ReactTestUtils.nextUpdate(root, function() {
        newDidFire = true;
      });

      component.forceUpdate(function() {
        expect(oldDidFire).toBe(true);
        expect(newDidFire).toBe(true);
      });
    });

    it("deregisters the new callback after the initial run", function() {
      var root = ReactTestUtils.renderIntoDocument(<TestComponent />);
      var component = ReactTestUtils.findRenderedComponentWithType(root, TestComponent);

      var original = component.componentDidUpdate;
      ReactTestUtils.nextUpdate(root, function() {});

      component.forceUpdate(function() {
        expect(component.componentDidUpdate === original).toBe(true);
      });
    });

  });
});
