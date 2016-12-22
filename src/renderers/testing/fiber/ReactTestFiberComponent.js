/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestFiberComponent
 * @preventMunge
 * @flow
 */

var instanceCounter = 0;

var ReactTestFiberComponent = {
  createElement(type, rawProps, rootContainerInstance) {
    const {children, ...props} = rawProps;
    var inst = {
      id: instanceCounter++,
      type: type,
      children: typeof children === 'undefined' ? null : Array.isArray(children) ? children : [children],
      props: props,
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    Object.defineProperty(inst, '$$typeof', {
      value: Symbol.for('react.test.json'),
    });
    // todo: something like this?
    // const mockInst = rootContainerInstance.createNodeMock(inst);
    return inst;
  },
  setInitialProperties() {
    throw new Error('TODO: setInitialProperties');
  },
  updateProperties(element, type, oldProps, newProps) {
    const {children, ...props} = newProps;
    element.type = type;
    element.props = props;
    element.children = typeof children === 'undefined' ? null : Array.isArray(children) ? children : [children];
  },
};

module.exports = ReactTestFiberComponent;
