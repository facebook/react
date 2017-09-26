/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
