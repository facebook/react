/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  it('allows createRef in component constructors', () => {
    class Component extends React.Component {
      ref = React.createRef();
      render() {
        return <div>Oh yes!</div>;
      }
    }

    const renderer = ReactTestRenderer.create(<Component />);

    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['Oh yes!'],
    });
  });

  it('should warn in dev if used within a function component', () => {
    function Component() {
      React.createRef();
      return <div>Oh no!</div>;
    }

    function Wrapper(props) {
      return props.children;
    }

    let renderer;
    expect(() => {
      renderer = ReactTestRenderer.create(
        <Wrapper>
          <Component />
        </Wrapper>,
      );
    }).toWarnDev(
      'Warning: Component is a function component but called ' +
        'React.createRef(). This will create a new ref on every render ' +
        'instead of reusing it. Did you mean to use React.useRef() instead?\n' +
        '    in Component (at **)\n' +
        '    in Wrapper (at **)',
    );

    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['Oh no!'],
    });
  });
});
