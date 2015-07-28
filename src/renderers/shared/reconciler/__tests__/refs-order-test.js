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

var React;

describe('refs-attach-order', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
  });

  it('should be before component lifecycle', function() {
    var container = document.createElement('div');
    var parentRef;
    var Child = React.createClass({
      componentDidMount: function() {
        parentRef = this.props.target();
      },
      render: function() {
        return <a />;
      }
    });
    var Parent = React.createClass({
      getParentNode: function() {
        return this.refs.parent;
      },
      render: function() {
        return <div ref="parent"><Child target={this.getParentNode}/></div>;
      }
    });

    React.render(<Parent />, container);
    expect(!!parentRef).toBe(true);
    React.unmountComponentAtNode(container);
  });
});
