/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-for-of-loops/no-for-of-loops */

import {transformFromAstSync, traverse} from '@babel/core';
import {parse as babelParse} from '@babel/parser';
import {Directive, File} from '@babel/types';
// @ts-expect-error: no types available
import PluginProposalPrivateMethods from '@babel/plugin-proposal-private-methods';
import BabelPluginReactCompiler, {
  parsePluginOptions,
  validateEnvironmentConfig,
  OPT_OUT_DIRECTIVES,
  type PluginOptions,
  Logger,
  LoggerEvent,
} from 'babel-plugin-react-compiler';
import type {SourceCode} from 'eslint';
import {SourceLocation} from 'estree';
import * as HermesParser from 'hermes-parser';
import {isDeepStrictEqual} from 'util';
import type {ParseResult} from '@babel/parser';

const COMPILER_OPTIONS: Partial<PluginOptions> = {
  noEmit: true,
  panicThreshold: 'none',
  // Don't emit errors on Flow suppressions--Flow already gave a signal
  flowSuppressions: false,
  environment: validateEnvironmentConfig({
    validateRefAccessDuringRender: true,
    validateNoSetStateInRender: true,
    validateNoSetStateInEffects: true,
    validateNoJSXInTryStatements: true,
    validateNoImpureFunctionsInRender: true,
    validateStaticComponents: true,
    validateNoFreezingKnownMutableFunctions: true,
    validateNoVoidUseMemo: true,
    // TODO: remove, this should be in the type system
    validateNoCapitalizedCalls: [],
    validateHooksUsage: true,
    validateNoDerivedComputationsInEffects: true,
  }),
};

export type UnusedOptOutDirective = {
  loc: SourceLocation;
  range: [number, number];
  directive: string;
};
export type RunCacheEntry = {
  sourceCode: string;
  filename: string;
  userOpts: PluginOptions;
  flowSuppressions: Array<{line: number; code: string}>;
  unusedOptOutDirectives: Array<UnusedOptOutDirective>;
  events: Array<LoggerEvent>;
};

type RunParams = {
  sourceCode: SourceCode;
  filename: string;
  userOpts: PluginOptions;
};
const FLOW_SUPPRESSION_REGEX = /\$FlowFixMe\[([^\]]*)\]/g;

function getFlowSuppressions(
  sourceCode: SourceCode,
): Array<{line: number; code: string}> {
  const comments = sourceCode.getAllComments();
  const results: Array<{line: number; code: string}> = [];

  for (const commentNode of comments) {
    const matches = commentNode.value.matchAll(FLOW_SUPPRESSION_REGEX);
    for (const match of matches) {
      if (match.index != null && commentNode.loc != null) {
        const code = match[1];
        results.push({
          line: commentNode.loc!.end.line,
          code,
        });
      }
    }
  }
  return results;
}

function filterUnusedOptOutDirectives(
  directives: ReadonlyArray<Directive>,
): Array<UnusedOptOutDirective> {
  const results: Array<UnusedOptOutDirective> = [];
  for (const directive of directives) {
    if (
      OPT_OUT_DIRECTIVES.has(directive.value.value) &&
      directive.loc != null
    ) {
      results.push({
        loc: directive.loc,
        directive: directive.value.value,
        range: [directive.start!, directive.end!],
      });
    }
  }
  return results;
}

function runReactCompilerImpl({
  sourceCode,
  filename,
  userOpts,
}: RunParams): RunCacheEntry {
  // Compat with older versions of eslint
  const options: PluginOptions = parsePluginOptions({
    ...COMPILER_OPTIONS,
    ...userOpts,
    environment: {
      ...COMPILER_OPTIONS.environment,
      ...userOpts.environment,
    },
  });
  const results: RunCacheEntry = {
    sourceCode: sourceCode.text,
    filename,
    userOpts,
    flowSuppressions: [],
    unusedOptOutDirectives: [],
    events: [],
  };
  const userLogger: Logger | null = options.logger;
  options.logger = {
    logEvent: (eventFilename, event): void => {
      userLogger?.logEvent(eventFilename, event);
      results.events.push(event);
    },
  };

  try {
    options.environment = validateEnvironmentConfig(options.environment ?? {});
  } catch (err: unknown) {
    options.logger?.logEvent(filename, err as LoggerEvent);
  }

  let babelAST: ParseResult<File> | null = null;
  if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
    try {
      babelAST = babelParse(sourceCode.text, {
        sourceFilename: filename,
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx'],
      });
    } catch {
      /* empty */
    }
  } else {
    try {
      babelAST = HermesParser.parse(sourceCode.text, {
        babel: true,
        enableExperimentalComponentSyntax: true,
        sourceFilename: filename,
        sourceType: 'module',
      });
    } catch {
      /* empty */
    }
  }

  if (babelAST != null) {
    results.flowSuppressions = getFlowSuppressions(sourceCode);
    try {
      transformFromAstSync(babelAST, sourceCode.text, {
        filename,
        highlightCode: false,
        retainLines: true,
        plugins: [
          [PluginProposalPrivateMethods, {loose: true}],
          [BabelPluginReactCompiler, options],
        ],
        sourceType: 'module',
        configFile: false,
        babelrc: false,
      });

      if (results.events.filter(e => e.kind === 'CompileError').length === 0) {
        traverse(babelAST, {
          FunctionDeclaration(path) {
            results.unusedOptOutDirectives.push(
              ...filterUnusedOptOutDirectives(path.node.body.directives),
            );
          },
          ArrowFunctionExpression(path) {
            if (path.node.body.type === 'BlockStatement') {
              results.unusedOptOutDirectives.push(
                ...filterUnusedOptOutDirectives(path.node.body.directives),
              );
            }
          },
          FunctionExpression(path) {
            results.unusedOptOutDirectives.push(
              ...filterUnusedOptOutDirectives(path.node.body.directives),
            );
          },
        });
      }
    } catch (err) {
      /* errors handled by injected logger */
    }
  }

  return results;
}

const SENTINEL = Symbol();

// Array backed LRU cache -- should be small < 10 elements
class LRUCache<K, T> {
  // newest at headIdx, then headIdx + 1, ..., tailIdx
  #values: Array<[K, T | Error] | [typeof SENTINEL, void]>;
  #headIdx: number = 0;

  constructor(size: number) {
    this.#values = new Array(size).fill(SENTINEL);
  }

  // gets a value and sets it as "recently used"
  get(key: K): T | null {
    const idx = this.#values.findIndex(entry => entry[0] === key);
    // If found, move to front
    if (idx === this.#headIdx) {
      return this.#values[this.#headIdx][1] as T;
    } else if (idx < 0) {
      return null;
    }

    const entry: [K, T] = this.#values[idx] as [K, T];

    const len = this.#values.length;
    for (let i = 0; i < Math.min(idx, len - 1); i++) {
      this.#values[(this.#headIdx + i + 1) % len] =
        this.#values[(this.#headIdx + i) % len];
    }
    this.#values[this.#headIdx] = entry;
    return entry[1];
  }
  push(key: K, value: T): void {
    this.#headIdx =
      (this.#headIdx - 1 + this.#values.length) % this.#values.length;
    this.#values[this.#headIdx] = [key, value];
  }
}
const cache = new LRUCache<string, RunCacheEntry>(10);

export default function runReactCompiler({
  sourceCode,
  filename,
  userOpts,
}: RunParams): RunCacheEntry {
  const entry = cache.get(filename);
  if (
    entry != null &&
    entry.sourceCode === sourceCode.text &&
    isDeepStrictEqual(entry.userOpts, userOpts)
  ) {
    return entry;
  }

  const runEntry = runReactCompilerImpl({
    sourceCode,
    filename,
    userOpts,
  });
  // If we have a cache entry, we can update it
  if (entry != null) {
    Object.assign(entry, runEntry);
  } else {
    cache.push(filename, runEntry);
  }
  return {...runEntry};
}
