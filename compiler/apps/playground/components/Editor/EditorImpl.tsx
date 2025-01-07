/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parse as babelParse, ParseResult} from '@babel/parser';
import * as HermesParser from 'hermes-parser';
import * as t from '@babel/types';
import BabelPluginReactCompiler, {
  CompilerError,
  CompilerErrorDetail,
  Effect,
  ErrorSeverity,
  parseConfigPragmaForTests,
  ValueKind,
  type Hook,
  PluginOptions,
  CompilerPipelineValue,
  parsePluginOptions,
} from 'babel-plugin-react-compiler/src';
import {type EnvironmentConfig} from 'babel-plugin-react-compiler/src/HIR/Environment';
import clsx from 'clsx';
import invariant from 'invariant';
import {useSnackbar} from 'notistack';
import {useDeferredValue, useMemo} from 'react';
import {useMountEffect} from '../../hooks';
import {defaultStore} from '../../lib/defaultStore';
import {
  createMessage,
  initStoreFromUrlOrLocalStorage,
  MessageLevel,
  MessageSource,
  type Store,
} from '../../lib/stores';
import {useStore, useStoreDispatch} from '../StoreContext';
import Input from './Input';
import {
  CompilerOutput,
  CompilerTransformOutput,
  default as Output,
  PrintedCompilerPipelineValue,
} from './Output';
import {printFunctionWithOutlined} from 'babel-plugin-react-compiler/src/HIR/PrintHIR';
import {printReactiveFunctionWithOutlined} from 'babel-plugin-react-compiler/src/ReactiveScopes/PrintReactiveFunction';
import {transformFromAstSync} from '@babel/core';

function parseInput(
  input: string,
  language: 'flow' | 'typescript',
): ParseResult<t.File> {
  // Extract the first line to quickly check for custom test directives
  if (language === 'flow') {
    return HermesParser.parse(input, {
      babel: true,
      flow: 'all',
      sourceType: 'module',
      enableExperimentalComponentSyntax: true,
    });
  } else {
    return babelParse(input, {
      plugins: ['typescript', 'jsx'],
      sourceType: 'module',
    }) as ParseResult<t.File>;
  }
}

function invokeCompiler(
  source: string,
  language: 'flow' | 'typescript',
  environment: EnvironmentConfig,
  logIR: (pipelineValue: CompilerPipelineValue) => void,
): CompilerTransformOutput {
  const opts: PluginOptions = parsePluginOptions({
    logger: {
      debugLogIRs: logIR,
      logEvent: () => {},
    },
    environment,
  });
  const ast = parseInput(source, language);
  let result = transformFromAstSync(ast, source, {
    filename: '_playgroundFile.js',
    highlightCode: false,
    retainLines: true,
    plugins: [[BabelPluginReactCompiler, opts]],
    ast: true,
    sourceType: 'module',
    configFile: false,
    sourceMaps: true,
    babelrc: false,
  });
  if (result?.ast == null || result?.code == null || result?.map == null) {
    throw new Error('Expected successful compilation');
  }
  return {
    code: result.code,
    sourceMaps: result.map,
    language,
  };
}

const COMMON_HOOKS: Array<[string, Hook]> = [
  [
    'useFragment',
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    'usePaginationFragment',
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    'useRefetchableFragment',
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    'useLazyLoadQuery',
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    'usePreloadedQuery',
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
];

function compile(source: string): [CompilerOutput, 'flow' | 'typescript'] {
  const results = new Map<string, Array<PrintedCompilerPipelineValue>>();
  const error = new CompilerError();
  const upsert: (result: PrintedCompilerPipelineValue) => void = result => {
    const entry = results.get(result.name);
    if (Array.isArray(entry)) {
      entry.push(result);
    } else {
      results.set(result.name, [result]);
    }
  };
  let language: 'flow' | 'typescript';
  if (source.match(/\@flow/)) {
    language = 'flow';
  } else {
    language = 'typescript';
  }
  let transformOutput;
  try {
    // Extract the first line to quickly check for custom test directives
    const pragma = source.substring(0, source.indexOf('\n'));
    const config = parseConfigPragmaForTests(pragma);

    transformOutput = invokeCompiler(
      source,
      language,
      {...config, customHooks: new Map([...COMMON_HOOKS])},
      result => {
        switch (result.kind) {
          case 'ast': {
            break;
          }
          case 'hir': {
            upsert({
              kind: 'hir',
              fnName: result.value.id,
              name: result.name,
              value: printFunctionWithOutlined(result.value),
            });
            break;
          }
          case 'reactive': {
            upsert({
              kind: 'reactive',
              fnName: result.value.id,
              name: result.name,
              value: printReactiveFunctionWithOutlined(result.value),
            });
            break;
          }
          case 'debug': {
            upsert({
              kind: 'debug',
              fnName: null,
              name: result.name,
              value: result.value,
            });
            break;
          }
          default: {
            const _: never = result;
            throw new Error(`Unhandled result ${result}`);
          }
        }
      },
    );
  } catch (err) {
    /**
     * error might be an invariant violation or other runtime error
     * (i.e. object shape that is not CompilerError)
     */
    if (err instanceof CompilerError && err.details.length > 0) {
      error.details.push(...err.details);
    } else {
      /**
       * Handle unexpected failures by logging (to get a stack trace)
       * and reporting
       */
      console.error(err);
      error.details.push(
        new CompilerErrorDetail({
          severity: ErrorSeverity.Invariant,
          reason: `Unexpected failure when transforming input! ${err}`,
          loc: null,
          suggestions: null,
        }),
      );
    }
  }
  if (error.hasErrors()) {
    return [{kind: 'err', results, error: error}, language];
  }
  return [{kind: 'ok', results, transformOutput}, language];
}

export default function Editor(): JSX.Element {
  const store = useStore();
  const deferredStore = useDeferredValue(store);
  const dispatchStore = useStoreDispatch();
  const {enqueueSnackbar} = useSnackbar();
  const [compilerOutput, language] = useMemo(
    () => compile(deferredStore.source),
    [deferredStore.source],
  );

  useMountEffect(() => {
    let mountStore: Store;
    try {
      mountStore = initStoreFromUrlOrLocalStorage();
    } catch (e) {
      invariant(e instanceof Error, 'Only Error may be caught.');
      enqueueSnackbar(e.message, {
        variant: 'warning',
        ...createMessage(
          'Bad URL - fell back to the default Playground.',
          MessageLevel.Info,
          MessageSource.Playground,
        ),
      });
      mountStore = defaultStore;
    }
    dispatchStore({
      type: 'setStore',
      payload: {store: mountStore},
    });
  });

  return (
    <>
      <div className="relative flex basis top-14">
        <div className={clsx('relative sm:basis-1/4')}>
          <Input
            language={language}
            errors={
              compilerOutput.kind === 'err' ? compilerOutput.error.details : []
            }
          />
        </div>
        <div className={clsx('flex sm:flex flex-wrap')}>
          <Output store={deferredStore} compilerOutput={compilerOutput} />
        </div>
      </div>
    </>
  );
}
