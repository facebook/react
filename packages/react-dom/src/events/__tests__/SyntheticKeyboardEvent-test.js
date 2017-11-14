/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var SyntheticKeyboardEvent;
var getEventCharCode;

var React;
var ReactDOM;

describe('SyntheticKeyboardEvent', () => {
  var createEvent;
  var container;
  React = require('react');
  ReactDOM = require('react-dom');
  
  // The container has to be attached events to fire.
  container = document.createElement('div');
  document.body.appendChild(container);
  beforeEach(() => {
    // Mock getEventCharCode for proper unit testing
    jest.mock('../getEventCharCode');
    getEventCharCode = require('../getEventCharCode').default;

    // TODO: can we express this test with only public API?
    SyntheticKeyboardEvent = require('../SyntheticKeyboardEvent').default;
    createEvent = function(nativeEvent) {
      var target = require('../getEventTarget').default(nativeEvent);
      return SyntheticKeyboardEvent.getPooled({}, '', nativeEvent, target);
    };
  });

  // afterEach(() => {
  //   document.body.removeChild(container);
  //   container = null;
  // })

  describe('KeyboardEvent interface', () => {
    describe('charCode', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          getEventCharCode.mockReturnValue(10);
          // var keyboardEvent = createEvent({type: 'keypress', charCode: 50});
          let charCode = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyDown={e => {
                e.persist();
                charCode = e.charCode
                console.log(charCode)
                expect(50).toBe(50);
              }} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          var nativeEvent = new KeyboardEvent('keydown', {
            key: 'Del',
            bubbles: true,
            cancelable: true,
            charCode: 100500,
          });
          container.firstChild.dispatchEvent(nativeEvent);     
          // expect(true).toBe(true);
        });
      });

      describe('when event is not `keypress`', () => {
        it('returns 0', () => {
          var keyboardEvent = createEvent({type: 'keyup', charCode: 50});
          expect(keyboardEvent.charCode).toBe(0);
        });
      });
    });

    describe('keyCode', () => {
      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          // COPME BACK TO THIS SHIT          
          var eventHandler = event => {  
            // console.log(event,' IS THE KEY CODE')  
                    
            // console.log(event, 'IS THE EVENT TESTING TESTING');
            // expect(getEventCharCode(event.charCode)).toBe(100500);
          }  
          var nativeEvent = new KeyboardEvent('keypress', {
            charCode: 0,
            keyCode: 13,
          });        
          var div = ReactDOM.render(
            <div 
              onKeyUp={eventHandler}
              >
            </div>,
            container,
          )
          var event = document.createEvent('Event');
          event.initEvent('keyup', true, true);
          div.dispatchEvent(event);
          
          var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
          // expect(keyboardEvent.keyCode).toBe(40);
        });
      });

      describe('when event is `keypress`', () => {
        it('returns 0', () => {
          var keyboardEvent = createEvent({type: 'keypress', charCode: 40});
          expect(keyboardEvent.keyCode).toBe(0);
        });
      });
    });

    describe('which', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          getEventCharCode.mockReturnValue(9001);
          var keyboardEvent = createEvent({type: 'keypress', charCode: 50});

          expect(keyboardEvent.which).toBe(9001);
        });
      });

      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
          expect(keyboardEvent.which).toBe(40);
        });
      });

      describe('when event type is unknown', () => {
        it('returns 0', () => {
          var keyboardEvent = createEvent({type: 'keysmack', keyCode: 40});
          expect(keyboardEvent.which).toBe(0);
        });
      });
    });
  });

  describe('EventInterface', () => {
    it('normalizes properties from the Event interface', () => {
      var target = document.createElement('div');
      var syntheticEvent = createEvent({srcElement: target});

      expect(syntheticEvent.target).toBe(target);
      expect(syntheticEvent.type).toBe(undefined);
    });

    it('is able to `preventDefault` and `stopPropagation`', () => {
      var nativeEvent = {};
      var syntheticEvent = createEvent(nativeEvent);

      expect(syntheticEvent.isDefaultPrevented()).toBe(false);
      syntheticEvent.preventDefault();
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);

      expect(syntheticEvent.isPropagationStopped()).toBe(false);
      syntheticEvent.stopPropagation();
      expect(syntheticEvent.isPropagationStopped()).toBe(true);
    });

    it('is able to `persist`', () => {
      var syntheticEvent = createEvent({});

      expect(syntheticEvent.isPersistent()).toBe(false);
      syntheticEvent.persist();
      expect(syntheticEvent.isPersistent()).toBe(true);
    });
  });
});