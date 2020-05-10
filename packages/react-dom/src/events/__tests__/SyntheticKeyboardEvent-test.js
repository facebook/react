/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('SyntheticKeyboardEvent', () => {
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

  describe('KeyboardEvent interface', () => {
    describe('charCode', () => {
      describe('when event is `keypress`', () => {
        describe('when charCode is present in nativeEvent', () => {
          it('when charCode is 0 and keyCode is 13, returns 13', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                charCode: 0,
                keyCode: 13,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(13);
          });

          it('when charCode is 32 or bigger and keyCode is missing, returns charCode', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                charCode: 32,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(32);
          });

          it('when charCode is 13 and keyCode is missing, returns charCode', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                charCode: 13,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(13);
          });

          // Firefox creates a keypress event for function keys too. This removes
          // the unwanted keypress events. Enter is however both printable and
          // non-printable. One would expect Tab to be as well (but it isn't).
          it('when charCode is smaller than 32 but is not 13, and keyCode is missing, ignores keypress', () => {
            let called = false;
            const node = ReactDOM.render(
              <input
                onKeyPress={() => {
                  called = true;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                charCode: 31,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(called).toBe(false);
          });

          it('when charCode is 10, returns 13', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                charCode: 10,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(13);
          });

          it('when charCode is 10 and ctrl is pressed, returns 13', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                charCode: 10,
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(13);
          });
        });

        // TODO: this seems IE8 specific.
        // We can probably remove this normalization.
        describe('when charCode is not present in nativeEvent', () => {
          let charCodeDescriptor;

          beforeEach(() => {
            charCodeDescriptor = Object.getOwnPropertyDescriptor(
              KeyboardEvent.prototype,
              'charCode',
            );
            delete KeyboardEvent.prototype.charCode;
          });

          afterEach(() => {
            // Don't forget to restore for other tests.
            Object.defineProperty(
              KeyboardEvent.prototype,
              'charCode',
              charCodeDescriptor,
            );
            charCodeDescriptor = null;
          });

          it('when keyCode is 32 or bigger, returns keyCode', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                keyCode: 32,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(32);
          });

          it('when keyCode is 13, returns 13', () => {
            let charCode = null;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  charCode = e.charCode;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                keyCode: 13,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(charCode).toBe(13);
          });

          it('when keyCode is smaller than 32 and is not 13, ignores keypress', () => {
            let called = false;
            const node = ReactDOM.render(
              <input
                onKeyPress={e => {
                  called = true;
                }}
              />,
              container,
            );
            node.dispatchEvent(
              new KeyboardEvent('keypress', {
                keyCode: 31,
                bubbles: true,
                cancelable: true,
              }),
            );
            expect(called).toBe(false);
          });
        });
      });

      describe('when event is not `keypress`', () => {
        it('returns 0', () => {
          let charCodeDown = null;
          let charCodeUp = null;
          const node = ReactDOM.render(
            <input
              onKeyDown={e => {
                charCodeDown = e.charCode;
              }}
              onKeyUp={e => {
                charCodeUp = e.charCode;
              }}
            />,
            container,
          );
          node.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Del',
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keyup', {
              key: 'Del',
              bubbles: true,
              cancelable: true,
            }),
          );
          expect(charCodeDown).toBe(0);
          expect(charCodeUp).toBe(0);
        });
      });

      it('when charCode is smaller than 32 but is not 13, and keyCode is missing, charCode is 0', () => {
        let charCode = null;
        const node = ReactDOM.render(
          <input
            onKeyDown={e => {
              charCode = e.charCode;
            }}
          />,
          container,
        );
        node.dispatchEvent(
          new KeyboardEvent('keydown', {
            charCode: 31,
            bubbles: true,
            cancelable: true,
          }),
        );
        expect(charCode).toBe(0);
      });
    });

    describe('keyCode', () => {
      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          let keyCodeDown = null;
          let keyCodeUp = null;
          const node = ReactDOM.render(
            <input
              onKeyDown={e => {
                keyCodeDown = e.keyCode;
              }}
              onKeyUp={e => {
                keyCodeUp = e.keyCode;
              }}
            />,
            container,
          );
          node.dispatchEvent(
            new KeyboardEvent('keydown', {
              keyCode: 40,
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keyup', {
              keyCode: 40,
              bubbles: true,
              cancelable: true,
            }),
          );
          expect(keyCodeDown).toBe(40);
          expect(keyCodeUp).toBe(40);
        });
      });

      describe('when event is `keypress`', () => {
        it('returns 0', () => {
          let keyCode = null;
          const node = ReactDOM.render(
            <input
              onKeyPress={e => {
                keyCode = e.keyCode;
              }}
            />,
            container,
          );
          node.dispatchEvent(
            new KeyboardEvent('keypress', {
              charCode: 65,
              bubbles: true,
              cancelable: true,
            }),
          );
          expect(keyCode).toBe(0);
        });
      });
    });

    describe('which', () => {
      describe('when event is `keypress`', () => {
        it('is consistent with `charCode`', () => {
          let calls = 0;
          const node = ReactDOM.render(
            <input
              onKeyPress={e => {
                expect(e.which).toBe(e.charCode);
                calls++;
              }}
            />,
            container,
          );
          // Try different combinations from other tests.
          node.dispatchEvent(
            new KeyboardEvent('keypress', {
              charCode: 0,
              keyCode: 13,
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keypress', {
              charCode: 32,
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keypress', {
              charCode: 13,
              bubbles: true,
              cancelable: true,
            }),
          );
          expect(calls).toBe(3);
        });
      });

      describe('when event is `keydown` or `keyup`', () => {
        it('is consistent with `keyCode`', () => {
          let calls = 0;
          const node = ReactDOM.render(
            <input
              onKeyDown={e => {
                expect(e.which).toBe(e.keyCode);
                calls++;
              }}
              onKeyUp={e => {
                expect(e.which).toBe(e.keyCode);
                calls++;
              }}
            />,
            container,
          );
          node.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Del',
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keydown', {
              charCode: 31,
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keydown', {
              keyCode: 40,
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keyup', {
              key: 'Del',
              bubbles: true,
              cancelable: true,
            }),
          );
          node.dispatchEvent(
            new KeyboardEvent('keyup', {
              keyCode: 40,
              bubbles: true,
              cancelable: true,
            }),
          );
          expect(calls).toBe(5);
        });
      });
    });

    describe('code', () => {
      it('returns code on `keydown`, `keyup` and `keypress`', () => {
        let codeDown = null;
        let codeUp = null;
        let codePress = null;
        const node = ReactDOM.render(
          <input
            onKeyDown={e => {
              codeDown = e.code;
            }}
            onKeyUp={e => {
              codeUp = e.code;
            }}
            onKeyPress={e => {
              codePress = e.code;
            }}
          />,
          container,
        );
        node.dispatchEvent(
          new KeyboardEvent('keydown', {
            code: 'KeyQ',
            bubbles: true,
            cancelable: true,
          }),
        );
        node.dispatchEvent(
          new KeyboardEvent('keyup', {
            code: 'KeyQ',
            bubbles: true,
            cancelable: true,
          }),
        );
        node.dispatchEvent(
          new KeyboardEvent('keypress', {
            code: 'KeyQ',
            charCode: 113,
            bubbles: true,
            cancelable: true,
          }),
        );
        expect(codeDown).toBe('KeyQ');
        expect(codeUp).toBe('KeyQ');
        expect(codePress).toBe('KeyQ');
      });
    });
  });

  describe('EventInterface', () => {
    it('is able to `preventDefault` and `stopPropagation`', () => {
      let expectedCount = 0;
      const eventHandler = event => {
        expect(event.isDefaultPrevented()).toBe(false);
        event.preventDefault();
        expect(event.isDefaultPrevented()).toBe(true);

        expect(event.isPropagationStopped()).toBe(false);
        event.stopPropagation();
        expect(event.isPropagationStopped()).toBe(true);
        expectedCount++;
      };
      const div = ReactDOM.render(
        <div
          onKeyDown={eventHandler}
          onKeyUp={eventHandler}
          onKeyPress={eventHandler}
        />,
        container,
      );

      div.dispatchEvent(
        new KeyboardEvent('keydown', {
          keyCode: 40,
          bubbles: true,
          cancelable: true,
        }),
      );
      div.dispatchEvent(
        new KeyboardEvent('keyup', {
          keyCode: 40,
          bubbles: true,
          cancelable: true,
        }),
      );
      div.dispatchEvent(
        new KeyboardEvent('keypress', {
          charCode: 40,
          keyCode: 40,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(expectedCount).toBe(3);
    });

    it('is able to `persist`', () => {
      const persistentEvents = [];
      const eventHandler = event => {
        expect(event.isPersistent()).toBe(false);
        event.persist();
        expect(event.isPersistent()).toBe(true);
        persistentEvents.push(event);
      };
      const div = ReactDOM.render(
        <div
          onKeyDown={eventHandler}
          onKeyUp={eventHandler}
          onKeyPress={eventHandler}
        />,
        container,
      );

      div.dispatchEvent(
        new KeyboardEvent('keydown', {
          keyCode: 40,
          bubbles: true,
          cancelable: true,
        }),
      );
      div.dispatchEvent(
        new KeyboardEvent('keyup', {
          keyCode: 40,
          bubbles: true,
          cancelable: true,
        }),
      );
      div.dispatchEvent(
        new KeyboardEvent('keypress', {
          charCode: 40,
          keyCode: 40,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(persistentEvents.length).toBe(3);
      expect(persistentEvents[0].type).toBe('keydown');
      expect(persistentEvents[1].type).toBe('keyup');
      expect(persistentEvents[2].type).toBe('keypress');
    });
  });
});
