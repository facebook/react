/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';
var React;
var ReactDOM;

var SyntheticKeyboardEvent;
var getEventCharCode;

var React;
var ReactDOM;

describe('SyntheticKeyboardEvent', () => {
  var container;

  var createEvent;
  beforeEach(() => {    
    React = require('react');
    ReactDOM = require('react-dom');
    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
    // Mock getEventCharCode for proper unit testing
    // jest.mock('../getEventCharCode');
    getEventCharCode = require('../getEventCharCode').default;
    // TODO: can we express this test with only public API?
    // SyntheticKeyboardEvent = require('../SyntheticKeyboardEvent').default;
    // createEvent = function(nativeEvent) {
    //   var target = require('../getEventTarget').default(nativeEvent);
    //   return SyntheticKeyboardEvent.getPooled({}, '', nativeEvent, target);
    // };
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  // afterEach(() => {
  //   document.body.removeChild(container);
  //   container = null;
  // })

  describe('KeyboardEvent interface', () => {
    describe('charCode', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          let charCode = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={e => {
                e.persist();
                charCode = getEventCharCode(e);
              }} />;
            }
          }
  
          ReactDOM.render(<Comp />, container);
  
          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 65,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(charCode).toBe(65);
        });
      });
      // AARBOLEDA PASSED
      describe('when event is not `keypress`', () => {
        it('returns 0', () => {
          let charCode = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyDown={e => {
                charCode = getEventCharCode(e);
              }} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          var nativeEvent = new KeyboardEvent('keydown', {
            key: 'Del',
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(charCode).toBe(0);          
        });
      });
    });
    // AARBOLEDA PASSED
    describe('keyCode', () => {
      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          let keyCode = null;
          class Comp extends React.Component {
          render() {
              return <input onKeyUp={e => (keyCode = e.keyCode)}/>;
            }
          }
          ReactDOM.render(<Comp />, container);
          var nativeEvent = new KeyboardEvent('keyup', {
            keyCode: 40,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(keyCode).toBe(40);

        });
      });

      describe('when event is `keypress`', () => {
        it('returns 0', () => {
          let keyCode = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={e => (keyCode = e.keyCode)} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 65,           
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(keyCode).toBe(0);
        });
      });
    });

    describe('which', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          // getEventCharCode.mockReturnValue(9001);
          // var keyboardEvent = createEvent({type: 'keypress', charCode: 50});

          // expect(keyboardEvent.which).toBe(9001);
          let which = null;
          class Comp extends React.Component {
            render() {
              // return <input onKeyPress={e => (which = e.which)} />;
              return <input onKeyPress={e => {
                console.log('FIRE BITCH')
                console.log(e.which, 'iIS THE WHICH')
                // console.log(getEventCharCode(e), 'SHOULD BE 9001')
                // charCode = getEventCharCode(e);
              }} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 50,
            bubbles: true,
            cancelable: true,
          });
          console.log(which, 'IS WHICH !!!')
          container.firstChild.dispatchEvent(nativeEvent);
          expect(which).toBe(9001);
        });
      });

      // describe('when event is `keydown` or `keyup`', () => {
      //   it('returns a passed keyCode', () => {
      //     var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
      //     expect(keyboardEvent.which).toBe(40);
      //   });
      // });

      // describe('when event type is unknown', () => {
      //   it('returns 0', () => {
      //     var keyboardEvent = createEvent({type: 'keysmack', keyCode: 40});
      //     expect(keyboardEvent.which).toBe(0);
      //   });
      // });
    });
  });

  // describe('EventInterface', () => {
  //   it('normalizes properties from the Event interface', () => {
  //     var target = document.createElement('div');
  //     var syntheticEvent = createEvent({srcElement: target});

  //     expect(syntheticEvent.target).toBe(target);
  //     expect(syntheticEvent.type).toBe(undefined);
  //   });

  //   it('is able to `preventDefault` and `stopPropagation`', () => {
  //     var nativeEvent = {};
  //     var syntheticEvent = createEvent(nativeEvent);

  //     expect(syntheticEvent.isDefaultPrevented()).toBe(false);
  //     syntheticEvent.preventDefault();
  //     expect(syntheticEvent.isDefaultPrevented()).toBe(true);

  //     expect(syntheticEvent.isPropagationStopped()).toBe(false);
  //     syntheticEvent.stopPropagation();
  //     expect(syntheticEvent.isPropagationStopped()).toBe(true);
  //   });

  //   it('is able to `persist`', () => {
  //     var syntheticEvent = createEvent({});

  //     expect(syntheticEvent.isPersistent()).toBe(false);
  //     syntheticEvent.persist();
  //     expect(syntheticEvent.isPersistent()).toBe(true);
  //   });
  // });
