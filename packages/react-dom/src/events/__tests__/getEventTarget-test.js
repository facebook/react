/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('getEventTarget', () => {
  let container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('when event is implemented in a browser', () => {
    describe('when event is dispatch by target element', () => {
      it('get target element object', () => {
        let target = null;

        class Comp extends React.Component {
          render() {
            return <input onKeyDown={e => (target = e.target)} />;
          }
        }

        ReactDOM.render(<Comp />, container);

        const nativeEvent = new KeyboardEvent('keydown', {
          key: 'f',
          bubbles: true,
          cancelable: true,
        });
        expect(target).toEqual(null);
        container.firstChild.dispatchEvent(nativeEvent);
        expect(target).toEqual(container.firstChild);
      });

      // Normalize SVG <use> element events #4963
      it('get target element object in case the target has correspondingUseElement property', () => {
        let target = null;

        class Comp extends React.Component {
          render() {
            return (
              <svg>
                <circle
                  id="circleElement"
                  cx="5"
                  cy="5"
                  r="4"
                  onClick={e => (target = e.target)}
                />
                <use
                  id="useElement"
                  href="#circleElement"
                  x="10"
                  fill="blue"
                  onClick={e => (target = e.target)}
                />
              </svg>
            );
          }
        }

        ReactDOM.render(<Comp />, container);

        const nativeEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });

        const useElement = document.querySelector('#useElement');
        const circleElement = document.querySelector('#circleElement');
        // Normalize SVG <use> element events #4963
        useElement.correspondingUseElement = circleElement;

        expect(target).toEqual(null);
        useElement.dispatchEvent(nativeEvent);
        expect(target).toEqual(circleElement);
      });
    });

    describe('when event dispatch by text node', () => {
      it('get target as parent element object', () => {
        let target = null;

        class Comp extends React.Component {
          render() {
            return <div onClick={e => (target = e.target)}>textNode</div>;
          }
        }

        ReactDOM.render(<Comp />, container);

        const nativeEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        const textNode = container.firstChild.firstChild;
        expect(target).toEqual(null);
        textNode.dispatchEvent(nativeEvent);
        expect(target).toEqual(container.firstChild);
      });
    });
  });
});
