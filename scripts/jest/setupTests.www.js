'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  jest.mock(
    'ReactFeatureFlags',
    () => jest.requireActual('shared/forks/ReactFeatureFlags.www-dynamic'),
    {virtual: true}
  );
  const actual = jest.requireActual('shared/forks/ReactFeatureFlags.www');

  // This flag is only used by tests, it should never be set elsewhere.
  actual.enableSyncDefaultUpdates = __VARIANT__;

  return actual;
});

jest.mock('scheduler/src/SchedulerFeatureFlags', () => {
  const schedulerSrcPath = process.cwd() + '/packages/scheduler';
  jest.mock(
    'SchedulerFeatureFlags',
    () =>
      jest.requireActual(
        schedulerSrcPath + '/src/forks/SchedulerFeatureFlags.www-dynamic'
      ),
    {virtual: true}
  );
  return jest.requireActual(
    schedulerSrcPath + '/src/forks/SchedulerFeatureFlags.www'
  );
});

global.__WWW__ = true;
