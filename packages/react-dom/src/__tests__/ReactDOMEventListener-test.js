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
      var childControl = <div onMouseOut={onMouseOut}>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div onMouseOut={onMouseOut}>div</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl = ReactDOM.render(parentControl, parentContainer);
      parentControl.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childControl.dispatchEvent(nativeEvent);

      expect(mouseOut).toBeCalled();
      expect(mouseOut.mock.calls.length).toBe(2);
      expect(mouseOut.mock.calls[0][0]).toEqual(childControl);
      expect(mouseOut.mock.calls[1][0]).toEqual(parentControl);

      document.body.removeChild(parentContainer);
    });

    it('should propagate events two levels down', () => {
      var mouseOut = jest.fn();
      var onMouseOut = event => mouseOut(event.currentTarget);

      var childContainer = document.createElement('div');
      var childControl = <div onMouseOut={onMouseOut}>Child</div>;
      var parentContainer = document.createElement('div');
      var parentControl = <div onMouseOut={onMouseOut}>Parent</div>;
      var grandParentContainer = document.createElement('div');
      var grandParentControl = <div onMouseOut={onMouseOut}>Parent</div>;
      childControl = ReactDOM.render(childControl, childContainer);
      parentControl = ReactDOM.render(parentControl, parentContainer);
      grandParentControl = ReactDOM.render(
        grandParentControl,
        grandParentContainer,
      );
      parentControl.appendChild(childContainer);
      grandParentControl.appendChild(parentContainer);

      document.body.appendChild(grandParentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childControl.dispatchEvent(nativeEvent);

      expect(mouseOut).toBeCalled();
      expect(mouseOut.mock.calls.length).toBe(3);
      expect(mouseOut.mock.calls[0][0]).toEqual(childControl);
      expect(mouseOut.mock.calls[1][0]).toEqual(parentControl);
      expect(mouseOut.mock.calls[2][0]).toEqual(grandParentControl);

      document.body.removeChild(grandParentContainer);
    });

    it('should not get confused by disappearing elements', () => {
      var mouseOut = jest.fn();
      var onChildMouseOut = e => {
        ReactDOM.unmountComponentAtNode(childContainer);
        mouseOut(e.currentTarget);
      };
      var onParentMouseOut = e => mouseOut(e.currentTarget);

      var childContainer = document.createElement('div');
      var parentContainer = document.createElement('div');
      var childControl = ReactDOM.render(
        <div onMouseOut={onChildMouseOut}>Child</div>,
        childContainer,
      );
      var parentControl = ReactDOM.render(
        <div onMouseOut={onParentMouseOut}>Parent</div>,
        parentContainer,
      );
      parentControl.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childControl.dispatchEvent(nativeEvent);
      var calls = mouseOut.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][0]).toEqual(childControl);
      expect(calls[1][0]).toEqual(parentControl);
      document.body.removeChild(parentContainer);
    });

    it('should batch between handlers from different roots', () => {
      var mock = jest.fn();

      var childContainer = document.createElement('div');
      var onMouseOut = () => {
        var childNode = ReactDOM.render(<div>1</div>, childContainer);
        mock(childNode.textContent);
      };

      var parentContainer = document.createElement('div');
      var onMouseOutParent = () => {
        var childNode = ReactDOM.render(<div>2</div>, childContainer);
        mock(childNode.textContent);
      };

      var childControl = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Child</div>,
        childContainer,
      );
      var parentControl = ReactDOM.render(
        <div onMouseOut={onMouseOutParent}>Parent</div>,
        parentContainer,
      );
      parentControl.appendChild(childContainer);

      document.body.appendChild(parentContainer);

      var nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      childControl.dispatchEvent(nativeEvent);

      expect(mock).toBeCalled();
      expect(mock.mock.calls[0][0]).toBe('Child');
      expect(mock.mock.calls[1][0]).toBe('Child');
      expect(childControl.textContent).toBe('2');

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
        return <div><div onMouseOut={onMouseOut} id="outer">{inner}</div></div>;
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
