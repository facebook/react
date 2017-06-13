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

var React;
var ReactTestUtils;
var reactComponentExpect;

describe('reactComponentExpect', () => {
  beforeEach(() => {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
  });

  it('should detect text components', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <div>This is a div</div>
            {'This is text'}
          </div>
        );
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<SomeComponent />);

    reactComponentExpect(component)
      .expectRenderedChild()
      .expectRenderedChildAt(1)
      .toBeTextComponentWithValue('This is text');
  });
});
