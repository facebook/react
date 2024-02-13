/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let act;

let TextWithStringRef;

describe('when different React version is used with string ref', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    TextWithStringRef = class extends React.Component {
      render() {
        jest.resetModules();
        React = require('react');
        return <span ref="foo">Hello world!</span>;
      }
    };
  });
  it('throws the "Refs must have owner" warning', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(
      act(() => {
        root.render(<TextWithStringRef />);
      }),
    ).rejects.toThrow(
      'Element ref was specified as a string (foo) but no owner was set. This could happen for one of' +
        ' the following reasons:\n' +
        '1. You may be adding a ref to a function component\n' +
        "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
        '3. You have multiple copies of React loaded\n' +
        'See https://reactjs.org/link/refs-must-have-owner for more information.',
    );
  });
});
