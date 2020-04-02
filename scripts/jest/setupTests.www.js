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
  wwwFlags.warnAboutUnmockedScheduler = defaultFlags.warnAboutUnmockedScheduler;
  wwwFlags.disableJavaScriptURLs = defaultFlags.disableJavaScriptURLs;
  wwwFlags.enableDeprecatedFlareAPI = defaultFlags.enableDeprecatedFlareAPI;

  return wwwFlags;
});
