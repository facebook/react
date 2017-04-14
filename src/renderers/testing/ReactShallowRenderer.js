/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactShallowRenderer
 * @preventMunge
 */

'use strict';

var React = require('react');
var ReactTestRenderer = require('ReactTestRenderer');

var emptyObject = require('fbjs/lib/emptyObject');
var getNextDebugID = require('getNextDebugID');
var invariant = require('fbjs/lib/invariant');

const ShallowNodeMockComponent = ({children}) => {
  return children ? React.Children.toArray(children) : [];
};

function createShallowNodeMock() {
  var isFirst = true;
  return element => {
    if (isFirst) {
      isFirst = false;
      return element.type;
    }
    return ShallowNodeMockComponent;
  };
}

class ReactShallowRenderer {
  getMountedInstance() {
    return this._renderer ? this._renderer.getInstance() : null;
  }

  getRenderOutput() {
    if (this._renderer) {
      const tree = this._renderer.toTree();
      // Convert the rendered output to a ReactElement.
      // This supports .toEqual() comparison for test elements.
      if (tree && tree.rendered) {
        return React.createElement(
          tree.rendered.type,
          tree.rendered.props,
          tree.rendered.props.children,
        );
      }
    }
    return null;
  }

  render(element, context) {
    invariant(
      React.isValidElement(element),
      'ReactShallowRenderer render(): Invalid component element.%s',
      typeof element === 'function'
        ? ' Instead of passing a component class, make sure to instantiate ' +
            'it by passing it to React.createElement.'
        : '',
    );
    invariant(
      typeof element.type !== 'string',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
        'components, not primitives (%s). Instead of calling `.render(el)` and ' +
        'inspecting the rendered output, look at `el.props` directly instead.',
      element.type,
    );

    // TODO (bvaughn) This approach won't work with context
    // Should we create a wrapper context-provider in this case?
    // See ReactTestUtils-test 'can pass context when shallowly rendering'
    this._renderer = ReactTestRenderer.create(element, {
      createNodeMock: createShallowNodeMock(),
    });

    return this.getRenderOutput();
  }

  unmount() {
    this._renderer.unmount();
  }
}

// Backwards compatible API
ReactShallowRenderer.createRenderer = function() {
  return new ReactShallowRenderer();
};

module.exports = ReactShallowRenderer;
