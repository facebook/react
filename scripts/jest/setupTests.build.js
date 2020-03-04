'use strict';

jest.mock('scheduler', () => require.requireActual('scheduler/unstable_mock'));
jest.mock('scheduler/src/SchedulerHostConfig', () =>
  require.requireActual('scheduler/src/forks/SchedulerHostConfig.mock.js')
);
jest.mock('react', () => require.requireActual(`react/unstable-testing`));
jest.mock('react-dom', () =>
  require.requireActual(`react-dom/unstable-testing`)
);
