'use strict';

// This module is the single source of truth for versioning packages that we
// publish to npm.
//
// Packages will not be published unless they are added here.
//
// The @latest channel uses the version as-is, e.g.:
//
//   18.0.0
//
// The @next channel appends additional information, with the scheme
// <version>-<label>-<commit_sha>, e.g.:
//
//   18.0.0-alpha-a1c2d3e4
//
// The @experimental channel doesn't include a version, only a date and a sha, e.g.:
//
//   0.0.0-experimental-241c4467e-20200129

const ReactVersion = '18.1.0';

// The label used by the @next channel. Represents the upcoming release's
// stability. Could be "alpha", "beta", "rc", etc.
const nextChannelLabel = 'next';

const stablePackages = {
  'create-subscription': ReactVersion,
  'eslint-plugin-react-hooks': '4.5.0',
  'jest-react': '0.13.1',
  react: ReactVersion,
  'react-art': ReactVersion,
  'react-dom': ReactVersion,
  'react-is': ReactVersion,
  'react-reconciler': '0.28.0',
  'react-refresh': '0.13.0',
  'react-test-renderer': ReactVersion,
  'use-subscription': '1.7.0',
  'use-sync-external-store': '1.1.0',
  scheduler: '0.22.0',
};

// These packages do not exist in the @next or @latest channel, only
// @experimental. We don't use semver, just the commit sha, so this is just a
// list of package names instead of a map.
const experimentalPackages = [
  'react-fetch',
  'react-fs',
  'react-pg',
  'react-server-dom-webpack',
];

module.exports = {
  ReactVersion,
  nextChannelLabel,
  stablePackages,
  experimentalPackages,
};
