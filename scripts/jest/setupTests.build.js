'use strict';

jest.mock('react-dom', () => require.requireActual(`react-dom/testing`));

jest.mock('scheduler', () => require.requireActual('scheduler/unstable_mock'));
jest.mock('scheduler/src/SchedulerHostConfig', () =>
  require.requireActual('scheduler/src/forks/SchedulerHostConfig.mock.js')
);
