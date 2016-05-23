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
var ReactNoop;

describe('ReactComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  /*it('should render a simple component', function() {

    function Bar() {
      return <div>Hello World</div>;
    }

    function Foo() {
      return <Bar isBar={true} />;
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flush();

  });*/

  it('should render a simple component, in steps if needed', function() {

    function Bar() {
      return <span><div>Hello World</div></span>;
    }

    function Foo() {
      return [
        <Bar isBar={true} />,
        <Bar isBar={true} />,
      ];
    }

    ReactNoop.render(<Foo />);
    console.log('Nothing done');
    ReactNoop.flushLowPri(7);
    console.log('Yield');
    ReactNoop.flushLowPri(50);
    console.log('Done');
  });


});
