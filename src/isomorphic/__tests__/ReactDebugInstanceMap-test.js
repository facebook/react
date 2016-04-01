/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDebugInstanceMap', function() {
  var React;
  var ReactDebugInstanceMap;
  var ReactDOM;

  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDebugInstanceMap = require('ReactDebugInstanceMap');
    ReactDOM = require('ReactDOM');
  });

  function createStubInstance() {
    return { mountComponent: () => {} };
  }

  it('should register and unregister instances', function() {
    var inst1 = createStubInstance();
    var inst2 = createStubInstance();

    expect(ReactDebugInstanceMap.isRegisteredInstance(inst1)).toBe(false);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst2)).toBe(false);

    ReactDebugInstanceMap.registerInstance(inst1);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst1)).toBe(true);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst2)).toBe(false);

    ReactDebugInstanceMap.registerInstance(inst2);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst1)).toBe(true);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst2)).toBe(true);

    ReactDebugInstanceMap.unregisterInstance(inst2);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst1)).toBe(true);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst2)).toBe(false);

    ReactDebugInstanceMap.unregisterInstance(inst1);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst1)).toBe(false);
    expect(ReactDebugInstanceMap.isRegisteredInstance(inst2)).toBe(false);
  });

  it('should assign stable IDs', function() {
    var inst1 = createStubInstance();
    var inst2 = createStubInstance();

    var inst1ID = ReactDebugInstanceMap.getIDForInstance(inst1);
    var inst2ID = ReactDebugInstanceMap.getIDForInstance(inst2);
    expect(typeof inst1ID).toBe('string');
    expect(typeof inst2ID).toBe('string');
    expect(inst1ID).not.toBe(inst2ID);

    ReactDebugInstanceMap.registerInstance(inst1);
    ReactDebugInstanceMap.registerInstance(inst2);
    expect(ReactDebugInstanceMap.getIDForInstance(inst1)).toBe(inst1ID);
    expect(ReactDebugInstanceMap.getIDForInstance(inst2)).toBe(inst2ID);

    ReactDebugInstanceMap.unregisterInstance(inst1);
    ReactDebugInstanceMap.unregisterInstance(inst2);
    expect(ReactDebugInstanceMap.getIDForInstance(inst1)).toBe(inst1ID);
    expect(ReactDebugInstanceMap.getIDForInstance(inst2)).toBe(inst2ID);
  });

  it('should retrieve registered instance by its ID', function() {
    var inst1 = createStubInstance();
    var inst2 = createStubInstance();

    var inst1ID = ReactDebugInstanceMap.getIDForInstance(inst1);
    var inst2ID = ReactDebugInstanceMap.getIDForInstance(inst2);
    expect(ReactDebugInstanceMap.getInstanceByID(inst1ID)).toBe(null);
    expect(ReactDebugInstanceMap.getInstanceByID(inst2ID)).toBe(null);

    ReactDebugInstanceMap.registerInstance(inst1);
    ReactDebugInstanceMap.registerInstance(inst2);
    expect(ReactDebugInstanceMap.getInstanceByID(inst1ID)).toBe(inst1);
    expect(ReactDebugInstanceMap.getInstanceByID(inst2ID)).toBe(inst2);

    ReactDebugInstanceMap.unregisterInstance(inst1);
    ReactDebugInstanceMap.unregisterInstance(inst2);
    expect(ReactDebugInstanceMap.getInstanceByID(inst1ID)).toBe(null);
    expect(ReactDebugInstanceMap.getInstanceByID(inst2ID)).toBe(null);
  });

  it('should warn when registering an instance twice', function() {
    spyOn(console, 'error');

    var inst = createStubInstance();
    ReactDebugInstanceMap.registerInstance(inst);
    expect(console.error.argsForCall.length).toBe(0);

    ReactDebugInstanceMap.registerInstance(inst);
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      'There is an internal error in the React developer tools integration. ' +
      'A registered instance should not be registered again. ' +
      'Please report this as a bug in React.'
    );

    ReactDebugInstanceMap.unregisterInstance(inst);
    ReactDebugInstanceMap.registerInstance(inst);
    expect(console.error.argsForCall.length).toBe(1);
  });

  it('should warn when unregistering an instance twice', function() {
    spyOn(console, 'error');
    var inst = createStubInstance();

    ReactDebugInstanceMap.unregisterInstance(inst);
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      'There is an internal error in the React developer tools integration. ' +
      'An unregistered instance should not be unregistered again. ' +
      'Please report this as a bug in React.'
    );

    ReactDebugInstanceMap.registerInstance(inst);
    ReactDebugInstanceMap.unregisterInstance(inst);
    expect(console.error.argsForCall.length).toBe(1);

    ReactDebugInstanceMap.unregisterInstance(inst);
    expect(console.error.argsForCall.length).toBe(2);
    expect(console.error.argsForCall[1][0]).toContain(
      'There is an internal error in the React developer tools integration. ' +
      'An unregistered instance should not be unregistered again. ' +
      'Please report this as a bug in React.'
    );
  });

  it('should warn about anything than is not an internal instance', function() {
    class Foo extends React.Component {
      render() {
        return <div />;
      }
    }

    spyOn(console, 'error');
    var warningCount = 0;
    var div = document.createElement('div');
    var publicInst = ReactDOM.render(<Foo />, div);

    [false, null, undefined, {}, div, publicInst].forEach(falsyValue => {
      ReactDebugInstanceMap.registerInstance(falsyValue);
      warningCount++;
      expect(ReactDebugInstanceMap.getIDForInstance(falsyValue)).toBe(null);
      warningCount++;
      expect(ReactDebugInstanceMap.isRegisteredInstance(falsyValue)).toBe(false);
      warningCount++;
      ReactDebugInstanceMap.unregisterInstance(falsyValue);
      warningCount++;
    });

    expect(console.error.argsForCall.length).toBe(warningCount);
    for (var i = 0; i < warningCount.length; i++) {
      // Ideally we could check for the more detailed error message here
      // but it depends on the input type and is meant for internal bugs
      // anyway so I don't think it's worth complicating the test with it.
      expect(console.error.argsForCall[i][0]).toContain(
        'There is an internal error in the React developer tools integration.'
      );
    }
  });
});
