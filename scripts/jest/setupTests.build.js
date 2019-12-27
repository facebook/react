'use strict';

jest.mock('scheduler', () => require.requireActual('scheduler/unstable_mock'));
jest.mock('scheduler/src/SchedulerHostConfig', () =>
  require.requireActual('scheduler/src/forks/SchedulerHostConfig.mock.js')
);
