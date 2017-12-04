/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMEventListener', () => {
  var React;
  var ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should dispatch events from outside React tree', () => {
    var mock = jest.fn();

    var container = document.createElement('div');
    var node = ReactDOM.render(<div onMouseEnter={mock} />, container);
    var otherNode = document.createElement('h1');
    document.body.appendChild(container);
    document.body.appendChild(otherNode);

    otherNode.dispatchEvent(
      new MouseEvent('mouseout', {
        bubbles: true,
        cancelable: true,
        relatedTarget: node,
      }),
    );
    expect(mock).toBeCalled();
  });

  describe('Propagation', () => {
    it('should propagate events one level down', () => {
      var mouseOut = jest.fn();
      var onMouseOut = event => mouseOut(event.currentTarget);

      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var childNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Child</div>,
        childContainer,
      );
      var parentNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>div</div>,
        parentContainer,
      );
      parentNode.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childNode.dispatchEvent(nativeEvent);

      expect(mouseOut).toBeCalled();
      expect(mouseOut.mock.calls.length).toBe(2);
      expect(mouseOut.mock.calls[0][0]).toEqual(childNode);
      expect(mouseOut.mock.calls[1][0]).toEqual(parentNode);

      document.body.removeChild(parentContainer);
    });

    it('should propagate events two levels down', () => {
      var mouseOut = jest.fn();
      var onMouseOut = event => mouseOut(event.currentTarget);

      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var grandParentContainer = document.createElement('div');
      var childNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Child</div>,
        childContainer,
      );
      var parentNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Parent</div>,
        parentContainer,
      );
      var grandParentNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Parent</div>,
        grandParentContainer,
      );
      parentNode.appendChild(childContainer);
      grandParentNode.appendChild(parentContainer);

      document.body.appendChild(grandParentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childNode.dispatchEvent(nativeEvent);

      expect(mouseOut).toBeCalled();
      expect(mouseOut.mock.calls.length).toBe(3);
      expect(mouseOut.mock.calls[0][0]).toEqual(childNode);
      expect(mouseOut.mock.calls[1][0]).toEqual(parentNode);
      expect(mouseOut.mock.calls[2][0]).toEqual(grandParentNode);

      document.body.removeChild(grandParentContainer);
    });

    // Regression test for https://github.com/facebook/react/issues/1105
    it('should not get confused by disappearing elements', () => {
      var container = document.createElement('div');
      document.body.appendChild(container);
      class MyComponent extends React.Component {
        state = {clicked: false};
        handleClick = () => {
          this.setState({clicked: true});
        };
        componentDidMount() {
          expect(ReactDOM.findDOMNode(this)).toBe(container.firstChild);
        }
        componentDidUpdate() {
          expect(ReactDOM.findDOMNode(this)).toBe(container.firstChild);
        }
        render() {
          if (this.state.clicked) {
            return <span>clicked!</span>;
          } else {
            return <button onClick={this.handleClick}>not yet clicked</button>;
          }
        }
      }
      ReactDOM.render(<MyComponent />, container);
      container.firstChild.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
        }),
      );
      expect(container.firstChild.textContent).toBe('clicked!');
      document.body.removeChild(container);
    });

    it('should batch between handlers from different roots', () => {
      var mock = jest.fn();

      var childContainer = document.createElement('div');
      var handleChildMouseOut = () => {
        ReactDOM.render(<div>1</div>, childContainer);
        mock(childNode.textContent);
      };

      var parentContainer = document.createElement('div');
      var handleParentMouseOut = () => {
        ReactDOM.render(<div>2</div>, childContainer);
        mock(childNode.textContent);
      };

      var childNode = ReactDOM.render(
        <div onMouseOut={handleChildMouseOut}>Child</div>,
        childContainer,
      );
      var parentNode = ReactDOM.render(
        <div onMouseOut={handleParentMouseOut}>Parent</div>,
        parentContainer,
      );
      parentNode.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childNode.dispatchEvent(nativeEvent);

      // Child and parent should both call from event handlers.
      expect(mock.mock.calls.length).toBe(2);
      // The first call schedules a render of '1' into the 'Child'.
      // However, we're batching so it isn't flushed yet.
      expect(mock.mock.calls[0][0]).toBe('Child');
      // The first call schedules a render of '2' into the 'Child'.
      // We're still batching so it isn't flushed yet either.
      expect(mock.mock.calls[1][0]).toBe('Child');
      // By the time we leave the handler, the second update is flushed.
      expect(childNode.textContent).toBe('2');
      document.body.removeChild(parentContainer);
    });
  });

  it('should not fire duplicate events for a React DOM tree', () => {
    var mouseOut = jest.fn();
    var onMouseOut = event => mouseOut(event.target);

    class Wrapper extends React.Component {
      getInner = () => {
        return this.refs.inner;
      };

      render() {
        var inner = <div ref="inner">Inner</div>;
        return (
          <div>
            <div onMouseOut={onMouseOut} id="outer">
              {inner}
            </div>
          </div>
        );
      }
    }

    var container = document.createElement('div');
    var instance = ReactDOM.render(<Wrapper />, container);

    document.body.appendChild(container);

    var nativeEvent = document.createEvent('Event');
    nativeEvent.initEvent('mouseout', true, true);
    instance.getInner().dispatchEvent(nativeEvent);

    expect(mouseOut).toBeCalled();
    expect(mouseOut.mock.calls.length).toBe(1);
    expect(mouseOut.mock.calls[0][0]).toEqual(instance.getInner());
    document.body.removeChild(container);
  });
});
