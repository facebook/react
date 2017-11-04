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
        class Comp extends React.Component {
          cb = e => {
            this.key = e.key;
          };

          render() {
            return <input ref={n => (this.a = n)} onKeyDown={this.cb} />;
          }
        }

        var container = document.createElement('div');
        var instance = ReactDOM.render(<Comp />, container);

        document.body.appendChild(container);

        var node = ReactDOM.findDOMNode(instance.a);

        var nativeEvent = new KeyboardEvent('keydown', {
          key: 'Del',
          bubbles: true,
          cancelable: true,
        });

        node.dispatchEvent(nativeEvent);

        expect(instance.key).toBe('Delete');

        document.body.removeChild(container);
      });
    });

    describe('when key is normalized', () => {
      it('returns a key', () => {
        class Comp extends React.Component {
          cb = e => {
            this.key = e.key;
          };

          render() {
            return <input ref={n => (this.a = n)} onKeyDown={this.cb} />;
          }
        }

        var container = document.createElement('div');
        var instance = ReactDOM.render(<Comp />, container);

        document.body.appendChild(container);

        var node = ReactDOM.findDOMNode(instance.a);

        var nativeEvent = new KeyboardEvent('keydown', {
          key: 'f',
          bubbles: true,
          cancelable: true,
        });

        node.dispatchEvent(nativeEvent);

        expect(instance.key).toBe('f');

        document.body.removeChild(container);
      });
    });
  });

  describe('when key is not implemented in a browser', () => {
    describe('when event type is keypress', () => {
      describe('when charCode is 13', () => {
        it('returns "Enter"', () => {
          class Comp extends React.Component {
            cb = e => {
              this.key = e.key;
            };

            render() {
              return <input ref={n => (this.a = n)} onKeyPress={this.cb} />;
            }
          }

          var container = document.createElement('div');
          var instance = ReactDOM.render(<Comp />, container);

          document.body.appendChild(container);

          var node = ReactDOM.findDOMNode(instance.a);

          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 13,
            bubbles: true,
            cancelable: true,
          });

          node.dispatchEvent(nativeEvent);

          expect(instance.key).toBe('Enter');

          document.body.removeChild(container);
        });
      });

      describe('when charCode is not 13', () => {
        it('returns a string from a charCode', () => {
          class Comp extends React.Component {
            cb = e => {
              this.key = e.key;
            };

            render() {
              return <input ref={n => (this.a = n)} onKeyPress={this.cb} />;
            }
          }

          var container = document.createElement('div');
          var instance = ReactDOM.render(<Comp />, container);

          document.body.appendChild(container);

          var node = ReactDOM.findDOMNode(instance.a);

          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 65,
            bubbles: true,
            cancelable: true,
          });

          node.dispatchEvent(nativeEvent);

          expect(instance.key).toBe('A');

          document.body.removeChild(container);
        });
      });
    });

    describe('when event type is keydown or keyup', () => {
      describe('when keyCode is recognized', () => {
        it('returns a translated key', () => {
          class Comp extends React.Component {
            cb = e => {
              this.key = e.key;
            };

            render() {
              return <input ref={n => (this.a = n)} onKeyDown={this.cb} />;
            }
          }

          var container = document.createElement('div');
          var instance = ReactDOM.render(<Comp />, container);

          document.body.appendChild(container);

          var node = ReactDOM.findDOMNode(instance.a);

          var nativeEvent = new KeyboardEvent('keydown', {
            keyCode: 45,
            bubbles: true,
            cancelable: true,
          });

          node.dispatchEvent(nativeEvent);

          expect(instance.key).toBe('Insert');

          document.body.removeChild(container);
        });
      });

      describe('when keyCode is not recognized', () => {
        it('returns Unidentified', () => {
          class Comp extends React.Component {
            cb = e => {
              this.key = e.key;
            };

            render() {
              return <input ref={n => (this.a = n)} onKeyDown={this.cb} />;
            }
          }

          var container = document.createElement('div');
          var instance = ReactDOM.render(<Comp />, container);

          document.body.appendChild(container);

          var node = ReactDOM.findDOMNode(instance.a);

          var nativeEvent = new KeyboardEvent('keydown', {
            keyCode: 1337,
            bubbles: true,
            cancelable: true,
          });

          node.dispatchEvent(nativeEvent);

          expect(instance.key).toBe('Unidentified');

          document.body.removeChild(container);
        });
      });
    });
  });
});
