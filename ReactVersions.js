'use strict';

// This module is the single source of truth for versioning packages that we
// publish to npm.
//
// Packages will not be published unless they are added here.
//
// The @latest channel uses the version as-is, e.g.:
//
//   19.1.0
//
// The @canary channel appends additional information, with the scheme
// <version>-<label>-<commit_sha>, e.g.:
//
//   19.1.0-canary-a1c2d3e4
//
// The @experimental channel doesn't include a version, only a date and a sha, e.g.:
//
//   0.0.0-experimental-241c4467e-20200129

const ReactVersion = '19.2.0';

// The label used by the @canary channel. Represents the upcoming release's
// stability. Most of the time, this will be "canary", but we may temporarily
// choose to change it to "alpha", "beta", "rc", etc.
//
// It only affects the label used in the version string. To customize the
// npm dist tags used during publish, refer to .github/workflows/runtime_prereleases_*.yml.
const canaryChannelLabel = 'canary';

// If the canaryChannelLabel is "rc", the build pipeline will use this to build
// an RC version of the packages.
const rcNumber = 0;

const stablePackages = {
  'eslint-plugin-react-hooks': '6.1.0',
  'jest-react': '0.17.0',
  react: ReactVersion,
  'react-art': ReactVersion,
  'react-dom': ReactVersion,
  'react-server-dom-webpack': ReactVersion,
  'react-server-dom-turbopack': ReactVersion,
  'react-server-dom-parcel': ReactVersion,
  'react-is': ReactVersion,
  'react-reconciler': '0.33.0',
  'react-refresh': '0.18.0',
  'react-test-renderer': ReactVersion,
  'use-subscription': '1.12.0',
  'use-sync-external-store': '1.6.0',
  scheduler: '0.27.0',
};

// These packages do not exist in the @canary or @latest channel, only
// @experimental. We don't use semver, just the commit sha, so this is just a
// list of package names instead of a map.
const experimentalPackages = ['react-markup'];

module.exports = {
  ReactVersion,
  canaryChannelLabel,
  rcNumber,
  stablePackages,
  experimentalPackages,
};
