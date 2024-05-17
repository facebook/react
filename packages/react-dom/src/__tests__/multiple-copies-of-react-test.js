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
const ReactDOMClient = require('react-dom/client');
const act = require('internal-test-utils').act;

class TextWithStringRef extends React.Component {
  render() {
    jest.resetModules();
    React = require('react');
    return <span ref="foo">Hello world!</span>;
  }
}

describe('when different React version is used with string ref', () => {
  // @gate !disableStringRefs
  it('throws the "Refs must have owner" warning', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(
      act(() => {
        root.render(<TextWithStringRef />);
      }),
    )
      // TODO: This throws an AggregateError. Need to update test infra to
      // support matching against AggregateError.
      .rejects.toThrow();
  });
});
