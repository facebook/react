/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;

var ARG = {arg: true};
var ARG2 = {arg2: true};

const ChildComponent = ({id, eventHandler}) => (
  <div
    id={id + '__DIV'}
    onClickCapture={e =>
      eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
    }
    onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
    onMouseEnter={e => eventHandler(e.currentTarget.id, e.type, ARG)}
    onMouseLeave={e => eventHandler(e.currentTarget.id, e.type, ARG)}>
    <div
      id={id + '__DIV_1'}
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
      onMouseEnter={e => eventHandler(e.currentTarget.id, e.type, ARG)}
      onMouseLeave={e => eventHandler(e.currentTarget.id, e.type, ARG)}
    />
    <div
      id={id + '__DIV_2'}
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
      onMouseEnter={e => eventHandler(e.currentTarget.id, e.type, ARG2)}
      onMouseLeave={e => eventHandler(e.currentTarget.id, e.type, ARG)}
    />
  </div>
);

const ParentComponent = ({eventHandler}) => (
  <div
    id="P"
    onClickCapture={e =>
      eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
    }
    onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
    onMouseEnter={e => eventHandler(e.currentTarget.id, e.type, ARG)}
    onMouseLeave={e => eventHandler(e.currentTarget.id, e.type, ARG)}>
    <div
      id="P_P1"
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
      onMouseEnter={e => eventHandler(e.currentTarget.id, e.type, ARG)}
      onMouseLeave={e => eventHandler(e.currentTarget.id, e.type, ARG)}>
      <ChildComponent id="P_P1_C1" eventHandler={eventHandler} />
      <ChildComponent id="P_P1_C2" eventHandler={eventHandler} />
    </div>
    <div
      id="P_OneOff"
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
      onMouseEnter={e => eventHandler(e.currentTarget.id, e.type, ARG)}
      onMouseLeave={e => eventHandler(e.currentTarget.id, e.type, ARG)}
    />
  </div>
);

describe('ReactTreeTraversal', () => {
  var mockFn = jest.fn();
  var container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    mockFn.mockReset();

    container = document.createElement('div');
    document.body.appendChild(container);

    ReactDOM.render(<ParentComponent eventHandler={mockFn} />, container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('Two phase traversal', () => {
    it('should not traverse when target is outside component boundary', () => {
      const outerNode = document.createElement('div');
      document.body.appendChild(outerNode);

      outerNode.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should traverse two phase across component boundary', () => {
      var expectedCalls = [
        ['P', 'captured', 'click', ARG],
        ['P_P1', 'captured', 'click', ARG],
        ['P_P1_C1__DIV', 'captured', 'click', ARG],
        ['P_P1_C1__DIV_1', 'captured', 'click', ARG],

        ['P_P1_C1__DIV_1', 'bubbled', 'click', ARG],
        ['P_P1_C1__DIV', 'bubbled', 'click', ARG],
        ['P_P1', 'bubbled', 'click', ARG],
        ['P', 'bubbled', 'click', ARG],
      ];

      var node = document.getElementById('P_P1_C1__DIV_1');
      node.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });

    it('should traverse two phase at shallowest node', () => {
      var node = document.getElementById('P');
      node.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );

      var expectedCalls = [
        ['P', 'captured', 'click', ARG],
        ['P', 'bubbled', 'click', ARG],
      ];
      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });
  });

  describe('Enter leave traversal', () => {
    it('should not traverse when enter/leaving outside DOM', () => {
      var leaveNode = document.createElement('div');
      var enterNode = document.createElement('div');

      document.body.appendChild(leaveNode);
      document.body.appendChild(enterNode);

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should not traverse if enter/leave the same node', () => {
      var leaveNode = document.getElementById('P_P1_C1__DIV_1');
      var enterNode = document.getElementById('P_P1_C1__DIV_1');

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should traverse enter/leave to sibling - avoids parent', () => {
      var leaveNode = document.getElementById('P_P1_C1__DIV_1');
      var enterNode = document.getElementById('P_P1_C1__DIV_2');

      var expectedCalls = [
        ['P_P1_C1__DIV_1', 'mouseleave', ARG],
        // enter/leave shouldn't fire anything on the parent
        ['P_P1_C1__DIV_2', 'mouseenter', ARG2],
      ];

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });

    it('should traverse enter/leave to parent - avoids parent', () => {
      var leaveNode = document.getElementById('P_P1_C1__DIV_1');
      var enterNode = document.getElementById('P_P1_C1__DIV');

      var expectedCalls = [['P_P1_C1__DIV_1', 'mouseleave', ARG]];

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });

    it('should enter from the window', () => {
      var leaveNode = document.createElement('div');
      var enterNode = document.getElementById('P_P1_C1__DIV');

      document.body.appendChild(leaveNode); // From the window or outside of the React sandbox.

      var expectedCalls = [
        ['P', 'mouseenter', ARG],
        ['P_P1', 'mouseenter', ARG],
        ['P_P1_C1__DIV', 'mouseenter', ARG],
      ];

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });

    it('should enter from the window to the shallowest', () => {
      var leaveNode = document.createElement('div');
      var enterNode = document.getElementById('P');

      document.body.appendChild(leaveNode); // From the window or outside of the React sandbox.

      var expectedCalls = [['P', 'mouseenter', ARG]];

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });

    it('should leave to the window', () => {
      var leaveNode = document.getElementById('P_P1_C1__DIV');
      var enterNode = document.createElement('div');

      document.body.appendChild(enterNode); // To the window or outside of the React sandbox.

      var expectedCalls = [
        ['P_P1_C1__DIV', 'mouseleave', ARG],
        ['P_P1', 'mouseleave', ARG],
        ['P', 'mouseleave', ARG],
      ];

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });

    it('should leave to the window from the shallowest', () => {
      var leaveNode = document.getElementById('P');
      var enterNode = document.createElement('div');

      document.body.appendChild(enterNode); // To the window or outside of the React sandbox.

      var expectedCalls = [['P', 'mouseleave', ARG]];

      leaveNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: enterNode,
        }),
      );

      expect(mockFn.mock.calls).toEqual(expectedCalls);
    });
  });
});
