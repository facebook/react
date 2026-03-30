/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {runBabelPluginReactCompiler} from '../Babel/RunReactCompilerBabelPlugin';
import {isOutlinedByReactCompiler} from '../Utils/OutlinedByReactCompiler';

function compile(source: string): t.File {
  const result = runBabelPluginReactCompiler(
    source,
    'test.js',
    'flow',
    {
      compilationMode: 'all',
      environment: {
        enableCustomTypeDefinitionForReanimated: true,
      },
    },
    true,
  );

  expect(result.ast).not.toBeNull();
  expect(result.ast).not.toBeUndefined();

  return result.ast as t.File;
}

function getFunctionDeclaration(
  program: t.Program,
  name: string,
): t.FunctionDeclaration {
  const fn = program.body.find(
    statement =>
      t.isFunctionDeclaration(statement) && statement.id?.name === name,
  );

  expect(fn).toBeDefined();
  expect(t.isFunctionDeclaration(fn)).toBe(true);

  return fn as t.FunctionDeclaration;
}

describe('outlined function markers', () => {
  it('marks outlined helpers in the reanimated outlining repro', () => {
    const ast = compile(`
      import {useDerivedValue} from 'react-native-reanimated';

      const TestComponent = ({number}) => {
        const keyToIndex = useDerivedValue(() => [1, 2, 3].map(() => null));
        return null;
      };
    `);

    expect(
      isOutlinedByReactCompiler(getFunctionDeclaration(ast.program, '_temp')),
    ).toBe(true);
    expect(
      isOutlinedByReactCompiler(getFunctionDeclaration(ast.program, '_temp2')),
    ).toBe(true);
  });

  it('does not mark user-authored declarations', () => {
    const ast = compile(`
      function useFoo() {
        return [1, 2, 3].map(() => 1);
      }
    `);

    expect(
      isOutlinedByReactCompiler(getFunctionDeclaration(ast.program, '_temp')),
    ).toBe(true);
    expect(
      isOutlinedByReactCompiler(getFunctionDeclaration(ast.program, 'useFoo')),
    ).toBe(false);
  });
});
