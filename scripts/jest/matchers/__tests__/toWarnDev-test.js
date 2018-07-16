/**
 * Copyright (c) 2013-present, Facebook, Inc.
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
      console.error('Hello\n    in div');
    }).toWarnDev('Hello');
  });

  it('does not fail if all warnings contain a stack', () => {
    expect(() => {
      console.error('Hello\n    in div');
      console.error('Good day\n    in div');
      console.error('Bye\n    in div');
    }).toWarnDev(['Hello', 'Good day', 'Bye']);
  });

  it('does not fail if warnings without stack explicitly opt out', () => {
    expect(() => {
      console.error('Hello');
    }).toWarnDev('Hello', {withoutStack: true});
    expect(() => {
      console.error('Hello');
      console.error('Good day');
      console.error('Bye');
    }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: true});
  });

  it('does not fail when expected stack-less warning number matches the actual one', () => {
    expect(() => {
      console.error('Hello\n    in div');
      console.error('Good day');
      console.error('Bye\n    in div');
    }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: 1});
  });

  it('fails if a warning does not contain a stack', () => {
    expect(() => {
      expect(() => {
        console.error('Hello');
      }).toWarnDev('Hello');
    }).toThrow(
      'Received warning unexpectedly does not include a component stack'
    );
  });

  it('fails if some warnings do not contain a stack', () => {
    expect(() => {
      expect(() => {
        console.error('Hello\n    in div');
        console.error('Good day\n    in div');
        console.error('Bye');
      }).toWarnDev(['Hello', 'Good day', 'Bye']);
    }).toThrow(
      'Received warning unexpectedly does not include a component stack'
    );
    expect(() => {
      expect(() => {
        console.error('Hello');
        console.error('Good day\n    in div');
        console.error('Bye\n    in div');
      }).toWarnDev(['Hello', 'Good day', 'Bye']);
    }).toThrow(
      'Received warning unexpectedly does not include a component stack'
    );
    expect(() => {
      expect(() => {
        console.error('Hello\n    in div');
        console.error('Good day');
        console.error('Bye\n    in div');
      }).toWarnDev(['Hello', 'Good day', 'Bye']);
    }).toThrow(
      'Received warning unexpectedly does not include a component stack'
    );
    expect(() => {
      expect(() => {
        console.error('Hello');
        console.error('Good day');
        console.error('Bye');
      }).toWarnDev(['Hello', 'Good day', 'Bye']);
    }).toThrow(
      'Received warning unexpectedly does not include a component stack'
    );
  });

  it('fails if warning is expected to not have a stack, but does', () => {
    expect(() => {
      expect(() => {
        console.error('Hello\n    in div');
      }).toWarnDev('Hello', {withoutStack: true});
    }).toThrow('Received warning unexpectedly includes a component stack');
    expect(() => {
      expect(() => {
        console.error('Hello\n    in div');
        console.error('Good day');
        console.error('Bye\n    in div');
      }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: true});
    }).toThrow('Received warning unexpectedly includes a component stack');
  });

  it('fails if expected stack-less warning number does not match the actual one', () => {
    expect(() => {
      expect(() => {
        console.error('Hello\n    in div');
        console.error('Good day');
        console.error('Bye\n    in div');
      }).toWarnDev(['Hello', 'Good day', 'Bye'], {withoutStack: 4});
    }).toThrow('Expected 4 warnings without a component stack but received 1');
  });

  it('fails if withoutStack is invalid', () => {
    expect(() => {
      expect(() => {
        console.error('Hi');
      }).toWarnDev('Hi', {withoutStack: null});
    }).toThrow('Instead received object');
    expect(() => {
      expect(() => {
        console.error('Hi');
      }).toWarnDev('Hi', {withoutStack: {}});
    }).toThrow('Instead received object');
    expect(() => {
      expect(() => {
        console.error('Hi');
      }).toWarnDev('Hi', {withoutStack: 'haha'});
    }).toThrow('Instead received string');
  });
});
