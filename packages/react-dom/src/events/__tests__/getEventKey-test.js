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

describe('getEventKey', () => {
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

  describe('when key is implemented in a browser', () => {
    describe('when key is not normalized', () => {
      it('returns a normalized value', () => {
        let key = null;
        class Comp extends React.Component {
          render() {
            return <input onKeyDown={e => (key = e.key)} />;
          }
        }

        ReactDOM.render(<Comp />, container);

        const nativeEvent = new KeyboardEvent('keydown', {
          key: 'Del',
          bubbles: true,
          cancelable: true,
        });
        container.firstChild.dispatchEvent(nativeEvent);
        expect(key).toBe('Delete');
      });
    });

    describe('when key is normalized', () => {
      it('returns a key', () => {
        let key = null;
        class Comp extends React.Component {
          render() {
            return <input onKeyDown={e => (key = e.key)} />;
          }
        }

        ReactDOM.render(<Comp />, container);

        const nativeEvent = new KeyboardEvent('keydown', {
          key: 'f',
          bubbles: true,
          cancelable: true,
        });
        container.firstChild.dispatchEvent(nativeEvent);
        expect(key).toBe('f');
      });
    });
  });

  describe('when key is not implemented in a browser', () => {
    describe('when event type is keypress', () => {
      describe('when charCode is 13', () => {
        it('returns "Enter"', () => {
          let key = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={e => (key = e.key)} />;
            }
          }

          ReactDOM.render(<Comp />, container);

          const nativeEvent = new KeyboardEvent('keypress', {
            charCode: 13,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('Enter');
        });
      });

      describe('when charCode is not 13', () => {
        it('returns a string from a charCode', () => {
          let key = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={e => (key = e.key)} />;
            }
          }

          ReactDOM.render(<Comp />, container);

          const nativeEvent = new KeyboardEvent('keypress', {
            charCode: 65,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('A');
        });
      });
    });

    describe('when event type is keydown or keyup', () => {
      describe('when keyCode is recognized', () => {
        it('returns a translated key', () => {
          let key = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyDown={e => (key = e.key)} />;
            }
          }

          ReactDOM.render(<Comp />, container);

          const nativeEvent = new KeyboardEvent('keydown', {
            keyCode: 45,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('Insert');
        });
      });

      describe('when keyCode is not recognized', () => {
        it('returns Unidentified', () => {
          let key = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyDown={e => (key = e.key)} />;
            }
          }

          ReactDOM.render(<Comp />, container);

          const nativeEvent = new KeyboardEvent('keydown', {
            keyCode: 1337,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('Unidentified');
        });
      });
    });
  });
});
