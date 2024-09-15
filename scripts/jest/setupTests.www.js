'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  jest.mock(
    'ReactFeatureFlags',
    () => jest.requireActual('shared/forks/ReactFeatureFlags.www-dynamic'),
    {virtual: true}
  );
  const actual = jest.requireActual('shared/forks/ReactFeatureFlags.www');

  // Flags that aren't currently used, but we still want to force variants to keep the
  // code live.
  actual.disableInputAttributeSyncing = __VARIANT__;

  // These are hardcoded to true for the next release,
  // but still run the tests against both variants until
  // we remove the flag.
  actual.disableIEWorkarounds = __VARIANT__;
  actual.disableClientCache = __VARIANT__;

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
  const actual = jest.requireActual(
    schedulerSrcPath + '/src/forks/SchedulerFeatureFlags.www'
  );

  // These flags are not a dynamic on www, but we still want to run
  // tests in both versions.
  actual.enableSchedulerDebugging = __VARIANT__;

  return actual;
});

global.__WWW__ = true;
