/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactTestUtils;
let reactComponentExpect;

describe('reactComponentExpect', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
  });

  it('should detect text components', function() {
    const SomeComponent = React.createClass({
      render: function() {
        return (
          <div>
            <div>This is a div</div>
            {'This is text'}
          </div>
        );
      },
    });

    const component = ReactTestUtils.renderIntoDocument(<SomeComponent />);

    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(1)
      .toBeTextComponentWithValue('This is text');
  });
});
