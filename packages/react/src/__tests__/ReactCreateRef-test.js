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
let ReactDOM;
let ReactDOMClient;

describe('ReactCreateRef', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
  });

  it('should warn in dev if an invalid ref object is provided', () => {
    function Wrapper({children}) {
      return children;
    }

    class ExampleComponent extends React.Component {
      render() {
        return null;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    expect(() =>
      ReactDOM.flushSync(() => {
        root.render(
          <Wrapper>
            <div ref={{}} />
          </Wrapper>,
        );
      }),
    ).toErrorDev(
      'Unexpected ref object provided for div. ' +
        'Use either a ref-setter function or React.createRef().\n' +
        '    in div (at **)' +
        (gate(flags => flags.enableOwnerStacks)
          ? ''
          : '\n    in Wrapper (at **)'),
    );

    expect(() =>
      ReactDOM.flushSync(() => {
        root.render(
          <Wrapper>
            <ExampleComponent ref={{}} />
          </Wrapper>,
        );
      }),
    ).toErrorDev(
      'Unexpected ref object provided for ExampleComponent. ' +
        'Use either a ref-setter function or React.createRef().\n' +
        '    in ExampleComponent (at **)' +
        (gate(flags => flags.enableOwnerStacks)
          ? ''
          : '\n    in Wrapper (at **)'),
    );
  });
});
