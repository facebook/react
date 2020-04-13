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
  experimental: __EXPERIMENTAL__,
  stable: !__EXPERIMENTAL__,
};

function getTestFlags() {
  // These are required on demand because some of our tests mutate them. We try
  // not to but there are exceptions.
  const featureFlags = require('shared/ReactFeatureFlags');

  // Return a proxy so we can throw if you attempt to access a flag that
  // doesn't exist.
  return new Proxy(
    {
      // Feature flag aliases
      old: featureFlags.enableNewReconciler === true,
      new: featureFlags.enableNewReconciler === true,

      ...featureFlags,
      ...environmentFlags,
    },
    {
      get(flags, flagName) {
        const flagValue = flags[flagName];
        if (typeof flagValue !== 'boolean' && typeof flagName === 'string') {
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
