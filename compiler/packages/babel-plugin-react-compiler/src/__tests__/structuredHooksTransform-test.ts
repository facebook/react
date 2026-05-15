/** @jest-environment jsdom */

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {transformSync} from '@babel/core';
import {render} from '@testing-library/react';
import * as React from 'react';
import BabelPluginReactCompiler, {validateEnvironmentConfig} from '..';

const compilerEnvironment = validateEnvironmentConfig({});

function compileStructuredHooksModule(source: string): {
  compiledCode: string;
  exports: Record<string, unknown>;
} {
  const compiled = transformSync(source, {
    babelrc: false,
    configFile: false,
    filename: '/structured-hooks-transform-test.js',
    parserOpts: {
      plugins: ['jsx'],
    },
    plugins: [
      [
        BabelPluginReactCompiler,
        {
          compilationMode: 'annotation',
          enableEmitStructuredHooks: true,
          environment: compilerEnvironment,
          target: '18',
        },
      ],
    ],
  });

  if (compiled?.code == null) {
    throw new Error('Expected structured hooks source to compile.');
  }

  const executable = transformSync(compiled.code, {
    babelrc: false,
    configFile: false,
    filename: '/structured-hooks-transform-test.js',
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    presets: [['@babel/preset-react', {throwIfNamespace: false}]],
  });

  if (executable?.code == null) {
    throw new Error('Expected compiled structured hooks output to be executable.');
  }

  const module = {exports: {}};
  const evaluate = new Function('require', 'module', 'exports', executable.code);
  evaluate(require, module, module.exports);

  return {
    compiledCode: compiled.code,
    exports: module.exports as Record<string, unknown>,
  };
}

test('structured hooks lowering preserves dormant branch state across rerenders', () => {
  const {compiledCode, exports} = compileStructuredHooksModule(`
    import * as React from 'react';
    import {useState} from 'react';

    export function App(props) {
      'use structured hooks';

      if (props.showDetail) {
        const [label] = useState(() => props.initialLabel);
        return <div>{label}</div>;
      }

      return <div>hidden</div>;
    }
  `);

  expect(compiledCode).toContain('experimental_useStructuredHooks');
  expect(compiledCode).toContain('hooks.state("state_0"');

  const App = exports['App'] as React.ComponentType<{
    initialLabel: string;
    showDetail: boolean;
  }>;
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation((...args: Array<unknown>) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('ReactDOMTestUtils.act` is deprecated')
      ) {
        return;
      }
    });
  const {container, rerender, unmount} = render(
    React.createElement(App, {initialLabel: 'Ada', showDetail: true}),
  );

  try {
    expect(container.textContent).toBe('Ada');

    rerender(
      React.createElement(App, {initialLabel: 'Grace', showDetail: false}),
    );
    expect(container.textContent).toBe('hidden');

    rerender(
      React.createElement(App, {initialLabel: 'Grace', showDetail: true}),
    );
    expect(container.textContent).toBe('Ada');
  } finally {
    unmount();
    consoleErrorSpy.mockRestore();
  }
});