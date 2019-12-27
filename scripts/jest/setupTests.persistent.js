'use strict';

jest.mock('react-noop-renderer', () =>
  require.requireActual('react-noop-renderer/persistent')
);

global.__PERSISTENT__ = true;
