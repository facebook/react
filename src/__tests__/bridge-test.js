// @flow

describe('Bridge', () => {
  let Bridge;

  beforeEach(() => {
    Bridge = require('src/bridge').default;
  });

  it('should shutdown properly', () => {
    const wall = {
      listen: jest.fn(() => () => {}),
      send: jest.fn(),
    };
    const bridge = new Bridge(wall);

    // Check that we're wired up correctly.
    bridge.send('init');
    jest.runAllTimers();
    expect(wall.send).toHaveBeenCalledWith('init', undefined, undefined);

    // Should flush pending messages and then shut down.
    wall.send.mockClear();
    bridge.send('update', '1');
    bridge.send('update', '2');
    bridge.shutdown();
    jest.runAllTimers();
    expect(wall.send).toHaveBeenCalledWith('update', '1', undefined);
    expect(wall.send).toHaveBeenCalledWith('update', '2', undefined);
    expect(wall.send).toHaveBeenCalledWith('shutdown', undefined, undefined);

    // Verify that the Bridge doesn't send messages after shutdown.
    spyOn(console, 'warn');
    wall.send.mockClear();
    bridge.send('should not send');
    jest.runAllTimers();
    expect(wall.send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Cannot send message "should not send" through a Bridge that has been shutdown.'
    );
  });
});
