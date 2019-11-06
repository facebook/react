/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This entry point is intentionally not typed. It exists only for third-party
// renderers. The renderers we ship (such as React DOM) instead import a named
// "inline" entry point (for example, `react-server/flight.inline.dom`). It uses
// the same code, but the Flow configuration redirects the host config to its
// real implementation so we can check it against exact intended host types.
//
// Only one renderer (the one you passed to `yarn flow <renderer>`) is fully
// type-checked at any given time. The Flow config maps the
// `react-server/flight.inline.<renderer>` import (which is *not* Flow typed) to
// `react-server/flight.inline-typed` (which *is*) for the current renderer.
// On CI, we run Flow checks for each renderer separately.

'use strict';

const ReactFlightServer = require('./src/ReactFlightServer');

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.
module.exports = ReactFlightServer.default || ReactFlightServer;
