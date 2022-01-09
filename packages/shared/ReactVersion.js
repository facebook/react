/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: this is special because it gets imported during build.
//
// TODO: 17.0.3 has not been released to NPM;
// It exists as a placeholder so that DevTools can support work tag changes between releases.
// When we next publish a release (either 17.0.3 or 17.1.0), update the matching TODO in backend/renderer.js
// TODO: This module is used both by the release scripts and to expose a version
// at runtime. We should instead inject the version number as part of the build
// process, and use the ReactVersions.js module as the single source of truth.
export default '17.0.3';
