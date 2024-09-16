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
import assert from 'assert';
import type {
  CompilationMode,
  Logger,
  LoggerEvent,
  PanicThresholdOptions,
  PluginOptions,
} from 'babel-plugin-react-compiler/src/Entrypoint';
import type {Effect, ValueKind} from 'babel-plugin-react-compiler/src/HIR';
import type {
  Macro,
  MacroMethod,
  parseConfigPragma as ParseConfigPragma,
} from 'babel-plugin-react-compiler/src/HIR/Environment';
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

function makePluginOptions(
  firstLine: string,
  parseConfigPragmaFn: typeof ParseConfigPragma,
  EffectEnum: typeof Effect,
  ValueKindEnum: typeof ValueKind,
): [PluginOptions, Array<{filename: string | null; event: LoggerEvent}>] {
  let gating = null;
  let enableEmitInstrumentForget = null;
  let enableEmitFreeze = null;
  let enableEmitHookGuards = null;
  let compilationMode: CompilationMode = 'all';
  let runtimeModule = null;
  let panicThreshold: PanicThresholdOptions = 'all_errors';
  let hookPattern: string | null = null;
  // TODO(@mofeiZ) rewrite snap fixtures to @validatePreserveExistingMemo:false
  let validatePreserveExistingMemoizationGuarantees = false;
  let enableChangeDetectionForDebugging = null;
  let customMacros: null | Array<Macro> = null;
  let validateBlocklistedImports = null;

  if (firstLine.indexOf('@compilationMode(annotation)') !== -1) {
    assert(
      compilationMode === 'all',
      'Cannot set @compilationMode(..) more than once',
    );
    compilationMode = 'annotation';
  }
  if (firstLine.indexOf('@compilationMode(infer)') !== -1) {
    assert(
      compilationMode === 'all',
      'Cannot set @compilationMode(..) more than once',
    );
    compilationMode = 'infer';
  }

  if (firstLine.includes('@gating')) {
    gating = {
      source: 'ReactForgetFeatureFlag',
      importSpecifierName: 'isForgetEnabled_Fixtures',
    };
  }
  if (firstLine.includes('@instrumentForget')) {
    enableEmitInstrumentForget = {
      fn: {
        source: 'react-compiler-runtime',
        importSpecifierName: 'useRenderCounter',
      },
      gating: {
        source: 'react-compiler-runtime',
        importSpecifierName: 'shouldInstrument',
      },
      globalGating: '__DEV__',
    };
  }
  if (firstLine.includes('@enableEmitFreeze')) {
    enableEmitFreeze = {
      source: 'react-compiler-runtime',
      importSpecifierName: 'makeReadOnly',
    };
  }
  if (firstLine.includes('@enableEmitHookGuards')) {
    enableEmitHookGuards = {
      source: 'react-compiler-runtime',
      importSpecifierName: '$dispatcherGuard',
    };
  }
  const runtimeModuleMatch = /@runtimeModule="([^"]+)"/.exec(firstLine);
  if (runtimeModuleMatch) {
    runtimeModule = runtimeModuleMatch[1];
  }
  if (firstLine.includes('@panicThreshold(none)')) {
    panicThreshold = 'none';
  }

  let eslintSuppressionRules: Array<string> | null = null;
  const eslintSuppressionMatch = /@eslintSuppressionRules\(([^)]+)\)/.exec(
    firstLine,
  );
  if (eslintSuppressionMatch != null) {
    eslintSuppressionRules = eslintSuppressionMatch[1].split('|');
  }

  let flowSuppressions: boolean = false;
  if (firstLine.includes('@enableFlowSuppressions')) {
    flowSuppressions = true;
  }

  let ignoreUseNoForget: boolean = false;
  if (firstLine.includes('@ignoreUseNoForget')) {
    ignoreUseNoForget = true;
  }

  if (firstLine.includes('@validatePreserveExistingMemoizationGuarantees')) {
    validatePreserveExistingMemoizationGuarantees = true;
  }

  if (firstLine.includes('@enableChangeDetectionForDebugging')) {
    enableChangeDetectionForDebugging = {
      source: 'react-compiler-runtime',
      importSpecifierName: '$structuralCheck',
    };
  }
  const hookPatternMatch = /@hookPattern:"([^"]+)"/.exec(firstLine);
  if (
    hookPatternMatch &&
    hookPatternMatch.length > 1 &&
    hookPatternMatch[1].trim().length > 0
  ) {
    hookPattern = hookPatternMatch[1].trim();
  } else if (firstLine.includes('@hookPattern')) {
    throw new Error(
      'Invalid @hookPattern:"..." pragma, must contain the prefix between balanced double quotes eg @hookPattern:"pattern"',
    );
  }

  const customMacrosMatch = /@customMacros\(([^)]+)\)/.exec(firstLine);
  if (
    customMacrosMatch &&
    customMacrosMatch.length > 1 &&
    customMacrosMatch[1].trim().length > 0
  ) {
    const customMacrosStrs = customMacrosMatch[1]
      .split(' ')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (customMacrosStrs.length > 0) {
      customMacros = [];
      for (const customMacroStr of customMacrosStrs) {
        const props: Array<MacroMethod> = [];
        const customMacroSplit = customMacroStr.split('.');
        if (customMacroSplit.length > 0) {
          for (const elt of customMacroSplit.slice(1)) {
            if (elt === '*') {
              props.push({type: 'wildcard'});
            } else if (elt.length > 0) {
              props.push({type: 'name', name: elt});
            }
          }
          customMacros.push([customMacroSplit[0], props]);
        }
      }
    }
  }

  const validateBlocklistedImportsMatch =
    /@validateBlocklistedImports\(([^)]+)\)/.exec(firstLine);
  if (
    validateBlocklistedImportsMatch &&
    validateBlocklistedImportsMatch.length > 1 &&
    validateBlocklistedImportsMatch[1].trim().length > 0
  ) {
    validateBlocklistedImports = validateBlocklistedImportsMatch[1]
      .split(' ')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  let lowerContextAccess = null;
  if (firstLine.includes('@lowerContextAccess')) {
    lowerContextAccess = {
      source: 'react-compiler-runtime',
      importSpecifierName: 'useContext_withSelector',
    };
  }

  let logs: Array<{filename: string | null; event: LoggerEvent}> = [];
  let logger: Logger | null = null;
  if (firstLine.includes('@logger')) {
    logger = {
      logEvent(filename: string | null, event: LoggerEvent): void {
        logs.push({filename, event});
      },
    };
  }

  const config = parseConfigPragmaFn(firstLine);
  const options = {
    environment: {
      ...config,
      moduleTypeProvider: makeSharedRuntimeTypeProvider({
        EffectEnum,
        ValueKindEnum,
      }),
      customMacros,
      enableEmitFreeze,
      enableEmitInstrumentForget,
      enableEmitHookGuards,
      assertValidMutableRanges: true,
      enableSharedRuntime__testonly: true,
      hookPattern,
      validatePreserveExistingMemoizationGuarantees,
      enableChangeDetectionForDebugging,
      lowerContextAccess,
      validateBlocklistedImports,
    },
    compilationMode,
    logger,
    gating,
    panicThreshold,
    noEmit: false,
    runtimeModule,
    eslintSuppressionRules,
    flowSuppressions,
    ignoreUseNoForget,
    enableReanimatedCheck: false,
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
    EffectEnum,
    ValueKindEnum,
  );
  const forgetResult = transformFromAstSync(inputAst, input, {
    filename: virtualFilepath,
    highlightCode: false,
    retainLines: true,
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
