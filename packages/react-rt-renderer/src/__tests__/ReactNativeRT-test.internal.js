/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactNativeRT;
let RTManager;

describe('ReactNativeRT', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNativeRT = require('react-rt-renderer');
    RTManager = require('RTManager');
  });

  it('should be able to create and render a native component', () => {
    ReactNativeRT.render(<rt-box foo="test" />, 1);
    expect(RTManager.createNode).toBeCalled();
    expect(RTManager.appendChildToContext).toBeCalled();
    expect(RTManager.appendChild).not.toBeCalled();
    expect(RTManager.updateNode).not.toBeCalled();
  });

  it('should be able to create and update a native component', () => {
    ReactNativeRT.render(<rt-box foo="foo" />, 11);

    expect(RTManager.createNode.mock.calls.length).toBe(1);
    expect(RTManager.createNode).toBeCalledWith(1, 'rt-box', {foo: 'foo'});
    expect(RTManager.appendChildToContext.mock.calls.length).toBe(1);
    expect(RTManager.appendChild).not.toBeCalled();
    expect(RTManager.updateNode).not.toBeCalled();

    ReactNativeRT.render(<rt-box foo="bar" />, 11);

    expect(RTManager.createNode.mock.calls.length).toBe(1);
    expect(RTManager.appendChildToContext.mock.calls.length).toBe(1);
    expect(RTManager.appendChild).not.toBeCalled();
    expect(RTManager.updateNode).toBeCalledWith(1, {foo: 'bar'});

    ReactNativeRT.render(
      <rt-box foo="bar">
        <rt-box />
      </rt-box>,
      11,
    );

    expect(RTManager.createNode.mock.calls.length).toBe(2);
    expect(RTManager.appendChildToContext.mock.calls.length).toBe(1);
    expect(RTManager.appendChildToContext.mock.calls.length).toBe(1);
    expect(RTManager.updateNode.mock.calls.length).toBe(1);
  });
});
