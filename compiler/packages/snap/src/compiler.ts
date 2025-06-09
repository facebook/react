/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from '@babel/core';
import {transformFromAstSync} from '@babel/core';

import * as BabelParser from '@babel/parser';
import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import type {
  Logger,
  LoggerEvent,
  PluginOptions,
  CompilerReactTarget,
  CompilerPipelineValue,
} from 'babel-plugin-react-compiler/src/Entrypoint';
import type {Effect, ValueKind} from 'babel-plugin-react-compiler/src/HIR';
import type {parseConfigPragmaForTests as ParseConfigPragma} from 'babel-plugin-react-compiler/src/Utils/TestUtils';
import * as HermesParser from 'hermes-parser';
import invariant from 'invariant';
import path from 'path';
import prettier from 'prettier';
import SproutTodoFilter from './SproutTodoFilter';
import {isExpectError} from './fixture-utils';
import {makeSharedRuntimeTypeProvider} from './sprout/shared-runtime-type-provider';
export function parseLanguage(source: string): 'flow' | 'typescript' {
  return source.indexOf('@flow') !== -1 ? 'flow' : 'typescript';
}

/**
 * Parse react compiler plugin + environment options from test fixture. Note
 * that although this primarily uses `Environment:parseConfigPragma`, it also
 * has test fixture specific (i.e. not applicable to playground) parsing logic.
 */
function makePluginOptions(
  firstLine: string,
  parseConfigPragmaFn: typeof ParseConfigPragma,
  debugIRLogger: (value: CompilerPipelineValue) => void,
  EffectEnum: typeof Effect,
  ValueKindEnum: typeof ValueKind,
): [PluginOptions, Array<{filename: string | null; event: LoggerEvent}>] {
  // TODO(@mofeiZ) rewrite snap fixtures to @validatePreserveExistingMemo:false
  let validatePreserveExistingMemoizationGuarantees = false;
  let target: CompilerReactTarget = '19';

  /**
   * Snap currently runs all fixtures without `validatePreserveExistingMemo` as
   * most fixtures are interested in compilation output, not whether the
   * compiler was able to preserve existing memo.
   *
   * TODO: flip the default. `useMemo` is rare in test fixtures -- fixtures that
   * use useMemo should be explicit about whether this flag is enabled
   */
  if (firstLine.includes('@validatePreserveExistingMemoizationGuarantees')) {
    validatePreserveExistingMemoizationGuarantees = true;
  }

  const logs: Array<{filename: string | null; event: LoggerEvent}> = [];
  const logger: Logger = {
    logEvent: firstLine.includes('@loggerTestOnly')
      ? (filename, event) => {
          logs.push({filename, event});
        }
      : () => {},
    debugLogIRs: debugIRLogger,
  };

  const config = parseConfigPragmaFn(firstLine, {compilationMode: 'all'});
  const options = {
    ...config,
    environment: {
      ...config.environment,
      moduleTypeProvider: makeSharedRuntimeTypeProvider({
        EffectEnum,
        ValueKindEnum,
      }),
      assertValidMutableRanges: true,
      validatePreserveExistingMemoizationGuarantees,
    },
    logger,
    enableReanimatedCheck: false,
    target,
  };
  return [options, logs];
}

export function parseInput(
  input: string,
  filename: string,
  language: 'flow' | 'typescript',
): BabelCore.types.File {
  // Extract the first line to quickly check for custom test directives
  if (language === 'flow') {
    return HermesParser.parse(input, {
      babel: true,
      flow: 'all',
      sourceFilename: filename,
      sourceType: 'module',
      enableExperimentalComponentSyntax: true,
    });
  } else {
    return BabelParser.parse(input, {
      sourceFilename: filename,
      plugins: ['typescript', 'jsx'],
      sourceType: 'module',
    });
  }
}

function getEvaluatorPresets(
  language: 'typescript' | 'flow',
): Array<BabelCore.PluginItem> {
  const presets: Array<BabelCore.PluginItem> = [
    {
      plugins: [
        'babel-plugin-fbt',
        'babel-plugin-fbt-runtime',
        'babel-plugin-idx',
      ],
    },
  ];
  presets.push(
    language === 'typescript'
      ? [
          '@babel/preset-typescript',
          {
            /**
             * onlyRemoveTypeImports needs to be set as fbt imports
             * would otherwise be removed by this pass.
             * https://github.com/facebook/fbt/issues/49
             * https://github.com/facebook/sfbt/issues/72
             * https://dev.to/retyui/how-to-add-support-typescript-for-fbt-an-internationalization-framework-3lo0
             */
            onlyRemoveTypeImports: true,
          },
        ]
      : '@babel/preset-flow',
  );

  presets.push({
    plugins: ['@babel/plugin-syntax-jsx'],
  });
  presets.push(
    ['@babel/preset-react', {throwIfNamespace: false}],
    {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
    {
      plugins: [
        function BabelPluginRewriteRequirePath() {
          return {
            visitor: {
              CallExpression(path: NodePath<t.CallExpression>) {
                const {callee} = path.node;
                if (callee.type === 'Identifier' && callee.name === 'require') {
                  const arg = path.node.arguments[0];
                  if (arg.type === 'StringLiteral') {
                    // rewrite to use relative import as eval happens in
                    // sprout/evaluator.ts
                    if (arg.value === 'shared-runtime') {
                      arg.value = './shared-runtime';
                    } else if (arg.value === 'ReactForgetFeatureFlag') {
                      arg.value = './ReactForgetFeatureFlag';
                    } else if (arg.value === 'useEffectWrapper') {
                      arg.value = './useEffectWrapper';
                    }
                  }
                }
              },
            },
          };
        },
      ],
    },
  );
  return presets;
}
async function format(
  inputCode: string,
  language: 'typescript' | 'flow',
): Promise<string> {
  return await prettier.format(inputCode, {
    semi: true,
    parser: language === 'typescript' ? 'babel-ts' : 'flow',
  });
}
const TypescriptEvaluatorPresets = getEvaluatorPresets('typescript');
const FlowEvaluatorPresets = getEvaluatorPresets('flow');

export type TransformResult = {
  forgetOutput: string;
  logs: string | null;
  evaluatorCode: {
    original: string;
    forget: string;
  } | null;
};

export async function transformFixtureInput(
  input: string,
  fixturePath: string,
  parseConfigPragmaFn: typeof ParseConfigPragma,
  plugin: BabelCore.PluginObj,
  includeEvaluator: boolean,
  debugIRLogger: (value: CompilerPipelineValue) => void,
  EffectEnum: typeof Effect,
  ValueKindEnum: typeof ValueKind,
): Promise<{kind: 'ok'; value: TransformResult} | {kind: 'err'; msg: string}> {
  // Extract the first line to quickly check for custom test directives
  const firstLine = input.substring(0, input.indexOf('\n'));

  const language = parseLanguage(firstLine);
  // Preserve file extension as it determines typescript's babel transform
  // mode (e.g. stripping types, parsing rules for brackets)
  const filename =
    path.basename(fixturePath) + (language === 'typescript' ? '.ts' : '');
  const inputAst = parseInput(input, filename, language);
  // Give babel transforms an absolute path as relative paths get prefixed
  // with `cwd`, which is different across machines
  const virtualFilepath = '/' + filename;

  const presets =
    language === 'typescript'
      ? TypescriptEvaluatorPresets
      : FlowEvaluatorPresets;

  /**
   * Get Forget compiled code
   */
  const [options, logs] = makePluginOptions(
    firstLine,
    parseConfigPragmaFn,
    debugIRLogger,
    EffectEnum,
    ValueKindEnum,
  );
  const forgetResult = transformFromAstSync(inputAst, input, {
    filename: virtualFilepath,
    highlightCode: false,
    retainLines: true,
    compact: true,
    plugins: [
      [plugin, options],
      'babel-plugin-fbt',
      'babel-plugin-fbt-runtime',
      'babel-plugin-idx',
    ],
    sourceType: 'module',
    ast: includeEvaluator,
    cloneInputAst: includeEvaluator,
    configFile: false,
    babelrc: false,
  });
  invariant(
    forgetResult?.code != null,
    'Expected BabelPluginReactForget to codegen successfully.',
  );
  const forgetCode = forgetResult.code;
  let evaluatorCode = null;

  if (
    includeEvaluator &&
    !SproutTodoFilter.has(fixturePath) &&
    !isExpectError(filename)
  ) {
    let forgetEval: string;
    try {
      invariant(
        forgetResult?.ast != null,
        'Expected BabelPluginReactForget ast.',
      );
      const result = transformFromAstSync(forgetResult.ast, forgetCode, {
        presets,
        filename: virtualFilepath,
        configFile: false,
        babelrc: false,
      });
      if (result?.code == null) {
        return {
          kind: 'err',
          msg: 'Unexpected error in forget transform pipeline - no code emitted',
        };
      } else {
        forgetEval = result.code;
      }
    } catch (e) {
      return {
        kind: 'err',
        msg: 'Unexpected error in Forget transform pipeline: ' + e.message,
      };
    }

    /**
     * Get evaluator code for source (no Forget)
     */
    let originalEval: string;
    try {
      const result = transformFromAstSync(inputAst, input, {
        presets,
        filename: virtualFilepath,
        configFile: false,
        babelrc: false,
      });

      if (result?.code == null) {
        return {
          kind: 'err',
          msg: 'Unexpected error in non-forget transform pipeline - no code emitted',
        };
      } else {
        originalEval = result.code;
      }
    } catch (e) {
      return {
        kind: 'err',
        msg: 'Unexpected error in non-forget transform pipeline: ' + e.message,
      };
    }
    evaluatorCode = {
      forget: forgetEval,
      original: originalEval,
    };
  }
  const forgetOutput = await format(forgetCode, language);
  let formattedLogs = null;
  if (logs.length !== 0) {
    formattedLogs = logs
      .map(({event}) => {
        return JSON.stringify(event);
      })
      .join('\n');
  }
  return {
    kind: 'ok',
    value: {
      forgetOutput,
      logs: formattedLogs,
      evaluatorCode,
    },
  };
}
