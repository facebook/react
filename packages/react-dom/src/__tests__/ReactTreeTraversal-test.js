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
    }>
    <div
      id={id + '__DIV_1'}
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
    />
    <div
      id={id + '__DIV_2'}
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
    />
  </div>
);

const ParentComponent = ({eventHandler}) => (
  <div
    id="P"
    onClickCapture={e =>
      eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
    }
    onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}>
    <div
      id="P_P1"
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}>
      <ChildComponent id="P_P1_C1" eventHandler={eventHandler} />
      <ChildComponent id="P_P1_C2" eventHandler={eventHandler} />
    </div>
    <div
      id="P_OneOff"
      onClickCapture={e =>
        eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
      }
      onClick={e => eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)}
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
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('Two phase traversal', () => {
    it('should not traverse when target is outside component boundary', () => {
      const Component = ({eventHandler}) => (
        <div
          onClickCapture={e =>
            eventHandler(e.currentTarget.id, 'captured', e.type, ARG)
          }
          onClick={e =>
            eventHandler(e.currentTarget.id, 'bubbled', e.type, ARG)
          }
        />
      );

      ReactDOM.render(<Component eventHandler={mockFn} />, container);

      const outerNode = document.createElement('div');
      document.body.appendChild(outerNode);

      outerNode.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should traverse two phase across component boundary', () => {
      ReactDOM.render(<ParentComponent eventHandler={mockFn} />, container);

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
      ReactDOM.render(<ParentComponent eventHandler={mockFn} />, container);

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
    // TODO
  });

  describe('getFirstCommonAncestor', () => {
    // TODO
  });
});
