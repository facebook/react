/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('toWarnDev', () => {
  it('does not fail if a warning contains a stack', () => {
    expect(() => {
      if (__DEV__) {
        console.error('Hello\n    in div');
      }
    }).toWarnDev('Hello');
  });

  it('does not fail if all warnings contain a stack', () => {
    expect(() => {
      if (__DEV__) {
        console.error('Hello\n    in div');
        console.error('Good day\n    in div');
        console.error('Bye\n    in div');
      }
    }).toWarnDev(['Hello', 'Good day', 'Bye']);
  });

  it('does not fail if warnings without stack explicitly opt out', () => {
    expect(() => {
      if (__DEV__) {
        console.error('Hello');
      }
    }).toWarnDev('Hello', {withoutStack: true});
    expect(() => {
      if (__DEV__) {
        console.error('Hello');
        console.error('Good day');
        console.error('Bye');
      }
    }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: true});
  });

  it('does not fail when expected stack-less warning number matches the actual one', () => {
    expect(() => {
      if (__DEV__) {
        console.error('Hello\n    in div');
        console.error('Good day');
        console.error('Bye\n    in div');
      }
    }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: 1});
  });

  if (__DEV__) {
    // Helper methods avoids invalid toWarn().toThrow() nesting
    // See no-to-warn-dev-within-to-throw
    const expectToWarnAndToThrow = (expectBlock, expectedErrorMessage) => {
      let caughtError;
      try {
        expectBlock();
      } catch (error) {
        caughtError = error;
      }
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain(expectedErrorMessage);
    };

    it('fails if a warning does not contain a stack', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello');
        }).toWarnDev('Hello');
      }, 'Received warning unexpectedly does not include a component stack');
    });

    it('fails if some warnings do not contain a stack', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello\n    in div');
          console.error('Good day\n    in div');
          console.error('Bye');
        }).toWarnDev(['Hello', 'Good day', 'Bye']);
      }, 'Received warning unexpectedly does not include a component stack');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello');
          console.error('Good day\n    in div');
          console.error('Bye\n    in div');
        }).toWarnDev(['Hello', 'Good day', 'Bye']);
      }, 'Received warning unexpectedly does not include a component stack');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello\n    in div');
          console.error('Good day');
          console.error('Bye\n    in div');
        }).toWarnDev(['Hello', 'Good day', 'Bye']);
      }, 'Received warning unexpectedly does not include a component stack');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello');
          console.error('Good day');
          console.error('Bye');
        }).toWarnDev(['Hello', 'Good day', 'Bye']);
      }, 'Received warning unexpectedly does not include a component stack');
    });

    it('fails if warning is expected to not have a stack, but does', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello\n    in div');
        }).toWarnDev('Hello', {withoutStack: true});
      }, 'Received warning unexpectedly includes a component stack');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello\n    in div');
          console.error('Good day');
          console.error('Bye\n    in div');
        }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: true});
      }, 'Received warning unexpectedly includes a component stack');
    });

    it('fails if expected stack-less warning number does not match the actual one', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hello\n    in div');
          console.error('Good day');
          console.error('Bye\n    in div');
        }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: 4});
      }, 'Expected 4 warnings without a component stack but received 1');
    });

    it('fails if withoutStack is invalid', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi');
        }).toWarnDev('Hi', {withoutStack: null});
      }, 'Instead received object');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi');
        }).toWarnDev('Hi', {withoutStack: {}});
      }, 'Instead received object');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi');
        }).toWarnDev('Hi', {withoutStack: 'haha'});
      }, 'Instead received string');
    });

    it('fails if the argument number does not match', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi %s', 'Sara', 'extra');
        }).toWarnDev('Hi', {withoutStack: true});
      }, 'Received 2 arguments for a message with 1 placeholders');

      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi %s');
        }).toWarnDev('Hi', {withoutStack: true});
      }, 'Received 0 arguments for a message with 1 placeholders');
    });

    it('fails if stack is passed twice', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi %s%s', '\n    in div', '\n    in div');
        }).toWarnDev('Hi');
      }, 'Received more than one component stack for a warning');
    });

    it('fails if multiple strings are passed without an array wrapper', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi \n    in div');
        }).toWarnDev('Hi', 'Bye');
      }, 'toWarnDev() second argument, when present, should be an object');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi \n    in div');
          console.error('Bye \n    in div');
        }).toWarnDev('Hi', 'Bye');
      }, 'toWarnDev() second argument, when present, should be an object');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi \n    in div');
          console.error('Wow \n    in div');
          console.error('Bye \n    in div');
        }).toWarnDev('Hi', 'Bye');
      }, 'toWarnDev() second argument, when present, should be an object');
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi \n    in div');
          console.error('Wow \n    in div');
          console.error('Bye \n    in div');
        }).toWarnDev('Hi', 'Wow', 'Bye');
      }, 'toWarnDev() second argument, when present, should be an object');
    });

    it('fails on more than two arguments', () => {
      expectToWarnAndToThrow(() => {
        expect(() => {
          console.error('Hi \n    in div');
          console.error('Wow \n    in div');
          console.error('Bye \n    in div');
        }).toWarnDev('Hi', undefined, 'Bye');
      }, 'toWarnDev() received more than two arguments.');
    });
  }
});
