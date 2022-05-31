/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('Bridge', () => {
  let Bridge;

  beforeEach(() => {
    Bridge = require('react-devtools-shared/src/bridge').default;
  });

  // @reactVersion >=16.0
  it('should shutdown properly', () => {
    const wall = {
      listen: jest.fn(() => () => {}),
      send: jest.fn(),
    };
    const bridge = new Bridge(wall);

    // Check that we're wired up correctly.
    bridge.send('reloadAppForProfiling');
    jest.runAllTimers();
    expect(wall.send).toHaveBeenCalledWith('reloadAppForProfiling');

    // Should flush pending messages and then shut down.
    wall.send.mockClear();
    bridge.send('update', '1');
    bridge.send('update', '2');
    bridge.shutdown();
    jest.runAllTimers();
    expect(wall.send).toHaveBeenCalledWith('update', '1');
    expect(wall.send).toHaveBeenCalledWith('update', '2');
    expect(wall.send).toHaveBeenCalledWith('shutdown');

    // Verify that the Bridge doesn't send messages after shutdown.
    spyOn(console, 'warn');
    wall.send.mockClear();
    bridge.send('should not send');
    jest.runAllTimers();
    expect(wall.send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Cannot send message "should not send" through a Bridge that has been shutdown.',
    );
  });
});
