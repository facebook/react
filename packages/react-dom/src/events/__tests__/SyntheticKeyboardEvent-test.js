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

let getEventCharCode;

describe('SyntheticKeyboardEvent', () => {
  let container;

  beforeEach(() => {    
    React = require('react');
    ReactDOM = require('react-dom');
    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);

    getEventCharCode = require('../getEventCharCode').default;

  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });


  describe('KeyboardEvent interface', () => {
    describe('charCode', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          let charCode = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={event => {
                charCode= getEventCharCode(event);
              }} />;
            }
          }
  
          ReactDOM.render(<Comp />, container);
  
          var nativeEvent = new KeyboardEvent('keypress', {
            keyCode: 13,
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(charCode).toBe(13);
        });
      });
      describe('when event is not `keypress`', () => {
        it('returns 0', () => {
          let charCode = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyDown={e => {
                e.persist();
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
          const nativeEvent = new KeyboardEvent('keyup', {
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
          const nativeEvent = new KeyboardEvent('keypress', {
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
          let which = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={e => (which = e.which)} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          const nativeEvent = new KeyboardEvent('keypress', {
            key: 'a',
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(which).toBe(97);
        });
      });
      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          let which = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyDown={e => (which = e.which)} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          const nativeEvent = new KeyboardEvent('keydown', {
            key: 'a',
            keyCode: 40,
            bubbles: true,
            cancelable: true,
          });      
          container.firstChild.dispatchEvent(nativeEvent);
          expect(which).toBe(40);              
        });
      });

      // TODO (aarboleda) Need to register this keyboard event
      describe('when event type is unknown', () => {
        it('returns 0', () => {
          let which = null;
          class Comp extends React.Component {
            render() {
              return <input onKeyPress={e => (which = e.which)} />;
            }
          }
          ReactDOM.render(<Comp />, container);
          const nativeEvent = new KeyboardEvent('keysmack', {
            key: 'a',
            bubbles: true,
            cancelable: true,
          });
          container.firstChild.dispatchEvent(nativeEvent);
          expect(which).toBe(0);          
        });
      });
    });
  });

  describe('EventInterface', () => {
    it('normalizes properties from the Event interface', () => {
      let expectedCount = 0;
      let div;
      const eventHandler = type => event => {
        expect(event.target).toBe(div);
        expect(event.type).toBe(type);
        expectedCount++;
      }
      div = ReactDOM.render(
        <div
          onKeyDown={eventHandler('keydown')}
          onKeyPress={eventHandler('keypress')}
          onKeyUp={eventHandler('keyup')}
        />, 
        container,
      );
      let event;
      event = document.createEvent('Event');
      event.initEvent('keydown', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      })
      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        }
      })
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('keypress', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      });
      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        }
      });
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('keyup', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      });

      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        }
      });
      div.dispatchEvent(event);
      
      /*
      // TODO aarboleda1 This should be 3 events including the keypress event

      event = document.createEvent('Event');
      event.initEvent('keypress', true, true);
      // Emulate IE8
      Object.defineProperty(event, 'target', {
        get() {},
      });

      Object.defineProperty(event, 'srcElement', {
        get() {
          return div;
        }
      });
      div.dispatchEvent(event);
      */
      expect(expectedCount).toBe(2);
    });

    it('is able to `preventDefault` and `stopPropagation`', () => {
      let expectedCount = 0;
      let div;
      const eventHandler = event => {
        expect(event.isDefaultPrevented()).toBe(false);
        event.preventDefault();
        expect(event.isDefaultPrevented()).toBe(true);
        expect(event.isPropagationStopped()).toBe(false);
        event.stopPropagation();
        expect(event.isPropagationStopped()).toBe(true);
        expectedCount++;        
      };
      div = ReactDOM.render(
        <div
          onKeyDown={eventHandler}
          onKeyUp={eventHandler}
        />,
        container,
      );
      let event;
      event = document.createEvent('Event');
      event.initEvent('keydown', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('keyup', true, true);
      div.dispatchEvent(event);
      
      /*
        event = document.createEvent('Event');
        event.initEvent('keypress', true, true);
        div.dispatchEvent(event);
      */
      // TODO aarboleda1, this should be 3 events with the keypress event
      expect(expectedCount).toBe(2);
    });

    it('is able to `persist`', () => {
      const persistentEvents = [];
      const eventHandler = event => {
        expect(event.isPersistent()).toBe(false);
        event.persist();
        expect(event.isPersistent()).toBe(true);
        persistentEvents.push(event);        
      };
      let div = ReactDOM.render(
        <div
          onKeyDown={eventHandler}
          onKeyUp={eventHandler}
        />, 
        container,    
      );
      let event;
      event = document.createEvent('Event');
      event.initEvent('keydown', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('keyup', true, true);
      div.dispatchEvent(event);

      event = document.createEvent('Event');
      event.initEvent('keypress', true, true);
      div.dispatchEvent(event);
       
      // TODO aarboleda1, make this be 3 when keypres
      expect(persistentEvents.length).toBe(2);
      expect(persistentEvents[0].type).toBe('keydown');
      expect(persistentEvents[1].type).toBe('keyup');      
      // expect(persistentEvents[2].type).toBe('keypress');
    });
  });
});