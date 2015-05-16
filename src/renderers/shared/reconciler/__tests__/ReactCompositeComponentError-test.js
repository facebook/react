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

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var ReactErrorUtils = require('ReactErrorUtils');

describe('ReactCompositeComponent-error', function() {

  it('should be passed the component and method name', function() {
    spyOn(ReactErrorUtils, 'guard').andCallThrough();
    var Component = React.createClass({
      someHandler: function() {},
      render: function() {
        return <div />;
      }
    });

    new Component();

    expect(ReactErrorUtils.guard.mostRecentCall.args[1])
      .toEqual('Component.someHandler');
  });

});
