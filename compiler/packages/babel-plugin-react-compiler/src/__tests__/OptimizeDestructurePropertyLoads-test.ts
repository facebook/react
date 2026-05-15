/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as BabelParser from '@babel/parser';
import {transformFromAstSync} from '@babel/core';
import BabelPluginReactCompiler, {defaultOptions} from '..';

function compile(input: string): string {
  const ast = BabelParser.parse(input, {
    sourceFilename: 'test.js',
    plugins: ['typescript', 'jsx'],
    sourceType: 'module',
  });
  const result = transformFromAstSync(ast, input, {
    filename: 'test.js',
    highlightCode: false,
    retainLines: true,
    compact: true,
    plugins: [
      [
        BabelPluginReactCompiler,
        {
          ...defaultOptions,
          compilationMode: 'all',
          panicThreshold: 'all_errors',
          enableReanimatedCheck: false,
          logger: {logEvent() {}},
          environment: {
            ...defaultOptions.environment,
            validatePreserveExistingMemoizationGuarantees: false,
          },
        },
      ],
    ],
    sourceType: 'module',
    ast: false,
    cloneInputAst: false,
    configFile: false,
    babelrc: false,
  });

  expect(result?.code).toBeDefined();
  return result!.code!;
}

describe('OptimizeDestructurePropertyLoads', () => {
  it('rewrites non-excluded object rest property loads back to props', () => {
    const output = compile(
      'function Component(props) { const {bar, ...rest} = props; return <div>{rest.foo}</div>; }',
    );

    expect(output).toContain('!==props.foo');
    expect(output).not.toContain('!==props){');
    expect(output).not.toContain('rest.foo');
  });

  it('does not rewrite properties excluded by object rest destructuring', () => {
    const output = compile(
      'function Component(props) { const {foo, ...rest} = props; return <div>{rest.foo}</div>; }',
    );

    expect(output).toContain('!==props){');
    expect(output).toContain('rest.foo');
  });
});
