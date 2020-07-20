'use strict';

// These flags can be in a @gate pragma to declare that a test depends on
// certain conditions. They're like GKs.
//
// Examples:
//   // @gate enableBlocksAPI
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
//   // @gate enableBlocksAPI
//   // @gate __DEV__
//   test('both conditions must pass', () => {/*...*/})
//
// Or using logical operators
//   // @gate enableBlocksAPI && __DEV__
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

  // Use this for tests that are known to be broken.
  FIXME: false,
};

function getTestFlags() {
  // These are required on demand because some of our tests mutate them. We try
  // not to but there are exceptions.
  const featureFlags = require('shared/ReactFeatureFlags');

  // TODO: This is a heuristic to detect the release channel by checking a flag
  // that is known to only be enabled in www. What we should do instead is set
  // the release channel explicitly in the each test config file.
  const www = featureFlags.enableSuspenseCallback === true;
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
      www,

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
