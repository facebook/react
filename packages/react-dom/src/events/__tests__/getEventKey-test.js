/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('getEventKey', () => {
  var React;
  var ReactDOM;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
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

        var container = document.createElement('div');
        ReactDOM.render(<Comp />, container);
        document.body.appendChild(container);

        var nativeEvent = new KeyboardEvent('keydown', {
          key: 'Del',
          bubbles: true,
          cancelable: true,
        });
        container.firstChild.dispatchEvent(nativeEvent);
        expect(key).toBe('Delete');
        document.body.removeChild(container);
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

        var container = document.createElement('div');
        ReactDOM.render(<Comp />, container);
        document.body.appendChild(container);

        var nativeEvent = new KeyboardEvent('keydown', {
          key: 'f',
          bubbles: true,
          cancelable: true,
        });
        container.firstChild.dispatchEvent(nativeEvent);
        expect(key).toBe('f');
        document.body.removeChild(container);
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

          var container = document.createElement('div');
          ReactDOM.render(<Comp />, container);
          document.body.appendChild(container);

          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 13,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('Enter');
          document.body.removeChild(container);
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

          var container = document.createElement('div');
          ReactDOM.render(<Comp />, container);
          document.body.appendChild(container);

          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 65,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('A');
          document.body.removeChild(container);
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

          var container = document.createElement('div');
          ReactDOM.render(<Comp />, container);
          document.body.appendChild(container);

          var nativeEvent = new KeyboardEvent('keydown', {
            keyCode: 45,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('Insert');
          document.body.removeChild(container);
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

          var container = document.createElement('div');
          ReactDOM.render(<Comp />, container);
          document.body.appendChild(container);

          var nativeEvent = new KeyboardEvent('keydown', {
            keyCode: 1337,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(key).toBe('Unidentified');
          document.body.removeChild(container);
        });
      });
    });
  });
});
