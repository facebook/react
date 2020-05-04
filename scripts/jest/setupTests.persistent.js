'use strict';

jest.mock('react-noop-renderer', () =>
  jest.requireActual('react-noop-renderer/persistent')
);

global.__PERSISTENT__ = true;
