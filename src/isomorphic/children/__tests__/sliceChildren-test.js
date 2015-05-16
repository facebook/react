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

describe('sliceChildren', function() {

  var React;
  var ReactFragment;
  var ReactTestUtils;

  var sliceChildren;
  var reactComponentExpect;

  var Partial;

  beforeEach(function() {
    React = require('React');
    ReactFragment = require('ReactFragment');
    ReactTestUtils = require('ReactTestUtils');

    sliceChildren = require('sliceChildren');
    reactComponentExpect = require('reactComponentExpect');

    Partial = React.createClass({
      render: function() {
        return (
          <div>
            {sliceChildren(
              this.props.children,
              this.props.start,
              this.props.end
            )}
          </div>
        );
      }
    });
  });

  function renderAndSlice(set, start, end) {
    var instance = <Partial start={start} end={end}>{set}</Partial>;
    instance = ReactTestUtils.renderIntoDocument(instance);
    var rendered = reactComponentExpect(instance)
      .expectRenderedChild()
      .instance();
    return rendered.props.children;
  }

  function testKeyValuePairs(children, expectedPairs) {
    var obj = ReactFragment.extract(children);
    expect(obj).toEqual(expectedPairs);
  }

  it('should render the whole set if start zero is supplied', function() {
    var fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />
    ];
    var children = renderAndSlice(fullSet, 0);
    testKeyValuePairs(children, {
      '.$A': fullSet[0],
      '.$B': fullSet[1],
      '.$C': fullSet[2]
    });
  });

  it('should render the remaining set if no end index is supplied', function() {
    var fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />
    ];
    var children = renderAndSlice(fullSet, 1);
    testKeyValuePairs(children, {
      '.$B': fullSet[1],
      '.$C': fullSet[2]
    });
  });

  it('should exclude everything at or after the end index', function() {
    var fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
      <div key="D" />
    ];
    var children = renderAndSlice(fullSet, 1, 2);
    testKeyValuePairs(children, {
      '.$B': fullSet[1]
    });
  });

  it('should allow static children to be sliced', function() {
    var a = <div />;
    var b = <div />;
    var c = <div />;

    var instance = <Partial start={1} end={2}>{a}{b}{c}</Partial>;
    instance = ReactTestUtils.renderIntoDocument(instance);
    var rendered = reactComponentExpect(instance)
      .expectRenderedChild()
      .instance();

    testKeyValuePairs(rendered.props.children, {
      '.1': b
    });
  });

});
