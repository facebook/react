/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const findDOMNode =
  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.findDOMNode;
const StrictMode = React.StrictMode;

describe('findDOMNode', () => {
  it('findDOMNode should return null if passed null', () => {
    expect(findDOMNode(null)).toBe(null);
  });

  // @gate !disableLegacyMode
  it('findDOMNode should find dom element', () => {
    class MyNode extends React.Component {
      render() {
        return (
          <div>
            <span>Noise</span>
          </div>
        );
      }
    }

    const container = document.createElement('div');
    const myNode = ReactDOM.render(<MyNode />, container);
    const myDiv = findDOMNode(myNode);
    const mySameDiv = findDOMNode(myDiv);
    expect(myDiv.tagName).toBe('DIV');
    expect(mySameDiv).toBe(myDiv);
  });

  // @gate !disableLegacyMode
  it('findDOMNode should find dom element after an update from null', () => {
    function Bar({flag}) {
      if (flag) {
        return <span>A</span>;
      }
      return null;
    }
    class MyNode extends React.Component {
      render() {
        return <Bar flag={this.props.flag} />;
      }
    }

    const container = document.createElement('div');

    const myNodeA = ReactDOM.render(<MyNode />, container);
    const a = findDOMNode(myNodeA);
    expect(a).toBe(null);

    const myNodeB = ReactDOM.render(<MyNode flag={true} />, container);
    expect(myNodeA === myNodeB).toBe(true);

    const b = findDOMNode(myNodeB);
    expect(b.tagName).toBe('SPAN');
  });

  it('findDOMNode should reject random objects', () => {
    expect(function () {
      findDOMNode({foo: 'bar'});
    }).toThrowError('Argument appears to not be a ReactComponent. Keys: foo');
  });

  // @gate !disableLegacyMode
  it('findDOMNode should reject unmounted objects with render func', () => {
    class Foo extends React.Component {
      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    const inst = ReactDOM.render(<Foo />, container);
    ReactDOM.unmountComponentAtNode(container);

    expect(() => findDOMNode(inst)).toThrowError(
      'Unable to find node on an unmounted component.',
    );
  });

  // @gate !disableLegacyMode
  it('findDOMNode should not throw an error when called within a component that is not mounted', () => {
    class Bar extends React.Component {
      UNSAFE_componentWillMount() {
        expect(findDOMNode(this)).toBeNull();
      }

      render() {
        return <div />;
      }
    }
    expect(() => {
      const container = document.createElement('div');
      ReactDOM.render(<Bar />, container);
    }).not.toThrow();
  });

  // @gate !disableLegacyMode
  it('findDOMNode should warn if used to find a host component inside StrictMode', () => {
    let parent = undefined;
    let child = undefined;

    class ContainsStrictModeChild extends React.Component {
      render() {
        return (
          <StrictMode>
            <div ref={n => (child = n)} />
          </StrictMode>
        );
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ContainsStrictModeChild ref={n => (parent = n)} />,
      container,
    );

    let match;
    expect(() => (match = findDOMNode(parent))).toErrorDev([
      'Warning: findDOMNode is deprecated in StrictMode. ' +
        'findDOMNode was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-find-node' +
        '\n    in div (at **)' +
        '\n    in ContainsStrictModeChild (at **)',
    ]);
    expect(match).toBe(child);
  });

  // @gate !disableLegacyMode
  it('findDOMNode should warn if passed a component that is inside StrictMode', () => {
    let parent = undefined;
    let child = undefined;

    class IsInStrictMode extends React.Component {
      render() {
        return <div ref={n => (child = n)} />;
      }
    }

    const container = document.createElement('div');

    ReactDOM.render(
      <StrictMode>
        <IsInStrictMode ref={n => (parent = n)} />
      </StrictMode>,
      container,
    );

    let match;
    expect(() => (match = findDOMNode(parent))).toErrorDev([
      'Warning: findDOMNode is deprecated in StrictMode. ' +
        'findDOMNode was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-find-node' +
        '\n    in div (at **)' +
        '\n    in IsInStrictMode (at **)',
    ]);
    expect(match).toBe(child);
  });
});
