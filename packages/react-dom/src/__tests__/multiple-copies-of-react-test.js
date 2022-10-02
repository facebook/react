/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
const ReactTestUtils = require('react-dom/test-utils');

class TextWithStringRef extends React.Component {
  render() {
    jest.resetModules();
    React = require('react');
    return <span ref="foo">Hello world!</span>;
  }
}

describe('when different React version is used with string ref', () => {
  it('throws the "Refs must have owner" warning', () => {
    expect(() => {
      ReactTestUtils.renderIntoDocument(<TextWithStringRef />);
    }).toThrow(
      'Expected ref to be a function, an object returned by React.createRef(), or null.',
    );
  });
});
