/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

// NOTE: Intentionally using the dynamic version of the `gate` pragma to opt out
// the negative test behavior. If this test happens to pass when running
// against files source, that's fine. But all we care about is the behavior of
// the build artifacts.
// TODO: The experimental builds have a different version at runtime than
// the package.json because DevTools uses it for feature detection. Consider
// some other way of handling that.
test('ReactVersion matches package.json', () => {
  if (gate(flags => flags.build && flags.stable && !flags.www)) {
    const React = require('react');
    const packageJSON = require('react/package.json');
    expect(React.version).toBe(packageJSON.version);
  }
});
