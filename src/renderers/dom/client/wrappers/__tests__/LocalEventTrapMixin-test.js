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

describe('LocalEventTrapMixin', function() {
  var EventConstants;
  var LocalEventTrapMixin;
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    EventConstants = require('EventConstants');
    LocalEventTrapMixin = require('LocalEventTrapMixin');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('throws when trapping bubbled state on null', function() {
    var BadImage = React.createClass({
      mixins: [LocalEventTrapMixin],
      render: function() {
        return null;
      },
      componentDidMount: function() {
        this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, 'load');
      }
    });

    expect(function() {
      ReactTestUtils.renderIntoDocument(<BadImage />);
    }).toThrow(
      'Invariant Violation: ' +
      'LocalEventTrapMixin.trapBubbledEvent(...): ' +
      'Requires node to be rendered.'
    );
  });
});
