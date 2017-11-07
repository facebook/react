/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var ReactTestUtils = require('react-dom/test-utils');

describe('findDOMNode', () => {
  it('findDOMNode should return null if passed null', () => {
    expect(ReactDOM.findDOMNode(null)).toBe(null);
  });

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

    var myNode = ReactTestUtils.renderIntoDocument(<MyNode />);
    var myDiv = ReactDOM.findDOMNode(myNode);
    var mySameDiv = ReactDOM.findDOMNode(myDiv);
    expect(myDiv.tagName).toBe('DIV');
    expect(mySameDiv).toBe(myDiv);
  });

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

    var container = document.createElement('div');

    var myNodeA = ReactDOM.render(<MyNode />, container);
    var a = ReactDOM.findDOMNode(myNodeA);
    expect(a).toBe(null);

    var myNodeB = ReactDOM.render(<MyNode flag={true} />, container);
    expect(myNodeA === myNodeB).toBe(true);

    var b = ReactDOM.findDOMNode(myNodeB);
    expect(b.tagName).toBe('SPAN');
  });

  it('findDOMNode should reject random objects', () => {
    expect(function() {
      ReactDOM.findDOMNode({foo: 'bar'});
    }).toThrowError(
      'Element appears to be neither ReactComponent nor DOMNode. Keys: foo',
    );
  });

  it('findDOMNode should reject unmounted objects with render func', () => {
    class Foo extends React.Component {
      render() {
        return <div />;
      }
    }

    var container = document.createElement('div');
    var inst = ReactDOM.render(<Foo />, container);
    ReactDOM.unmountComponentAtNode(container);

    expect(() => ReactDOM.findDOMNode(inst)).toThrowError(
      'Unable to find node on an unmounted component.',
    );
  });

  it('findDOMNode should not throw an error when called within a component that is not mounted', () => {
    class Bar extends React.Component {
      componentWillMount() {
        expect(ReactDOM.findDOMNode(this)).toBeNull();
      }

      render() {
        return <div />;
      }
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Bar />)).not.toThrow();
  });
});
