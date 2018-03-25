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
let ReactTestRenderer;

describe('ReactCreateRef', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
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

    expect(() =>
      ReactTestRenderer.create(
        <Wrapper>
          <div ref={{}} />
        </Wrapper>,
      ),
    ).toWarnDev(
      'Unexpected ref object provided for div. ' +
        'Use either a ref-setter function or React.createRef().\n' +
        '    in div (at **)\n' +
        '    in Wrapper (at **)',
    );

    expect(() =>
      ReactTestRenderer.create(
        <Wrapper>
          <ExampleComponent ref={{}} />
        </Wrapper>,
      ),
    ).toWarnDev(
      'Unexpected ref object provided for ExampleComponent. ' +
        'Use either a ref-setter function or React.createRef().\n' +
        '    in ExampleComponent (at **)\n' +
        '    in Wrapper (at **)',
    );
  });
});
