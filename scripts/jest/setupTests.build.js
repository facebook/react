'use strict';

jest.mock('scheduler', () => jest.requireActual('scheduler/unstable_mock'));
jest.mock('scheduler/src/SchedulerHostConfig', () =>
  jest.requireActual('scheduler/src/forks/SchedulerHostConfig.mock.js')
);
