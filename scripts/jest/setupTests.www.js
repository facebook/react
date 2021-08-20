'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  jest.mock(
    'ReactFeatureFlags',
    () => jest.requireActual('shared/forks/ReactFeatureFlags.www-dynamic'),
    {virtual: true}
  );

  const wwwFlags = jest.requireActual('shared/forks/ReactFeatureFlags.www');
  const defaultFlags = jest.requireActual('shared/ReactFeatureFlags');

  // TODO: Many tests were written before we started running them against the
  // www configuration. Update those tests so that they work against the www
  // configuration, too. Then remove these overrides.
  wwwFlags.disableLegacyContext = defaultFlags.disableLegacyContext;
  wwwFlags.disableJavaScriptURLs = defaultFlags.disableJavaScriptURLs;

  return wwwFlags;
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
