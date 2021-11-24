'use strict';

// These flags can be in a @gate pragma to declare that a test depends on
// certain conditions. They're like GKs.
//
// Examples:
//   // @gate enableSomeAPI
//   test('uses an unstable API', () => {/*...*/})
//
//   // @gate __DEV__
//   test('only passes in development', () => {/*...*/})
//
// Most flags are defined in ReactFeatureFlags. If it's defined there, you don't
// have to do anything extra here.
//
// There are also flags based on the environment, like __DEV__. Feel free to
// add new flags and aliases below.
//
// You can also combine flags using multiple gates:
//
//   // @gate enableSomeAPI
//   // @gate __DEV__
//   test('both conditions must pass', () => {/*...*/})
//
// Or using logical operators
//   // @gate enableSomeAPI && __DEV__
//   test('both conditions must pass', () => {/*...*/})
//
// Negation also works:
//   // @gate !deprecateLegacyContext
//   test('uses a deprecated feature', () => {/*...*/})

// These flags are based on the environment and don't change for the entire
// test run.
const environmentFlags = {
  __DEV__,
  build: __DEV__ ? 'development' : 'production',

  // TODO: Should "experimental" also imply "modern"? Maybe we should
  // always compare to the channel?
  experimental: __EXPERIMENTAL__,
  // Similarly, should stable imply "classic"?
  stable: !__EXPERIMENTAL__,

  variant: __VARIANT__,

  persistent: global.__PERSISTENT__ === true,

  // Use this for tests that are known to be broken.
  FIXME: false,

  // Turn these flags back on (or delete) once the effect list is removed in
  // favor of a depth-first traversal using `subtreeTags`.
  dfsEffectsRefactor: true,
  enableUseJSStackToTrackPassiveDurations: false,
};

function getTestFlags() {
  // These are required on demand because some of our tests mutate them. We try
  // not to but there are exceptions.
  const featureFlags = require('shared/ReactFeatureFlags');
  const schedulerFeatureFlags = require('scheduler/src/SchedulerFeatureFlags');

  const www = global.__WWW__ === true;
  const releaseChannel = www
    ? __EXPERIMENTAL__
      ? 'modern'
      : 'classic'
    : __EXPERIMENTAL__
    ? 'experimental'
    : 'stable';

  // Return a proxy so we can throw if you attempt to access a flag that
  // doesn't exist.
  return new Proxy(
    {
      // Feature flag aliases
      old: featureFlags.enableNewReconciler === false,
      new: featureFlags.enableNewReconciler === true,

      channel: releaseChannel,
      modern: releaseChannel === 'modern',
      classic: releaseChannel === 'classic',
      source: !process.env.IS_BUILD,
      www,

      // This isn't a flag, just a useful alias for tests.
      enableUseSyncExternalStoreShim: !__VARIANT__,
      enableSuspenseList: releaseChannel === 'experimental' || www,

      // If there's a naming conflict between scheduler and React feature flags, the
      // React ones take precedence.
      // TODO: Maybe we should error on conflicts? Or we could namespace
      // the flags
      ...schedulerFeatureFlags,
      ...featureFlags,
      ...environmentFlags,
    },
    {
      get(flags, flagName) {
        const flagValue = flags[flagName];
        if (flagValue === undefined && typeof flagName === 'string') {
          throw Error(
            `Feature flag "${flagName}" does not exist. See TestFlags.js ` +
              'for more details.'
          );
        }
        return flagValue;
      },
    }
  );
}

exports.getTestFlags = getTestFlags;
