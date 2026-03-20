/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks').default;

describe('eslint-plugin-react-hooks flat configs', () => {
  it('binds both flat presets to the plugin instance', () => {
    const flatConfigs = ReactHooksESLintPlugin.configs.flat;

    expect(flatConfigs.recommended.plugins['react-hooks']).toBe(
      ReactHooksESLintPlugin
    );
    expect(flatConfigs['recommended-latest'].plugins['react-hooks']).toBe(
      ReactHooksESLintPlugin
    );
    expect(flatConfigs.recommended.rules).toBe(
      ReactHooksESLintPlugin.configs.recommended.rules
    );
    expect(flatConfigs['recommended-latest'].rules).toBe(
      ReactHooksESLintPlugin.configs['recommended-latest'].rules
    );
  });
});
