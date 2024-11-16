/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parse as babelParse} from '@babel/parser';
import * as HermesParser from 'hermes-parser';
import traverse, {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import {
  CompilerError,
  CompilerErrorDetail,
  Effect,
  ErrorSeverity,
  parseConfigPragmaForTests,
  ValueKind,
  runPlayground,
  type Hook,
  findDirectiveDisablingMemoization,
  findDirectiveEnablingMemoization,
} from 'babel-plugin-react-compiler/src';
import {type ReactFunctionType} from 'babel-plugin-react-compiler/src/HIR/Environment';
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
  default as Output,
  PrintedCompilerPipelineValue,
} from './Output';
import {printFunctionWithOutlined} from 'babel-plugin-react-compiler/src/HIR/PrintHIR';
import {printReactiveFunctionWithOutlined} from 'babel-plugin-react-compiler/src/ReactiveScopes/PrintReactiveFunction';

type FunctionLike =
  | NodePath<t.FunctionDeclaration>
  | NodePath<t.ArrowFunctionExpression>
  | NodePath<t.FunctionExpression>;
enum MemoizeDirectiveState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
  Undefined = 'Undefined',
}

const MEMOIZE_ENABLED_OR_UNDEFINED_STATES = new Set([
  MemoizeDirectiveState.Enabled,
  MemoizeDirectiveState.Undefined,
]);

const MEMOIZE_ENABLED_OR_DISABLED_STATES = new Set([
  MemoizeDirectiveState.Enabled,
  MemoizeDirectiveState.Disabled,
]);
function parseInput(input: string, language: 'flow' | 'typescript'): any {
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
    });
  }
}

function parseFunctions(
  source: string,
  language: 'flow' | 'typescript',
): Array<{
  compilationEnabled: boolean;
  fn: FunctionLike;
}> {
  const items: Array<{
    compilationEnabled: boolean;
    fn: FunctionLike;
  }> = [];
  try {
    const ast = parseInput(source, language);
    traverse(ast, {
      FunctionDeclaration(nodePath) {
        items.push({
          compilationEnabled: shouldCompile(nodePath),
          fn: nodePath,
        });
        nodePath.skip();
      },
      ArrowFunctionExpression(nodePath) {
        items.push({
          compilationEnabled: shouldCompile(nodePath),
          fn: nodePath,
        });
        nodePath.skip();
      },
      FunctionExpression(nodePath) {
        items.push({
          compilationEnabled: shouldCompile(nodePath),
          fn: nodePath,
        });
        nodePath.skip();
      },
    });
  } catch (e) {
    console.error(e);
    CompilerError.throwInvalidJS({
      reason: String(e),
      description: null,
      loc: null,
      suggestions: null,
    });
  }

  return items;
}

function shouldCompile(fn: FunctionLike): boolean {
  const {body} = fn.node;
  if (t.isBlockStatement(body)) {
    const selfCheck = checkExplicitMemoizeDirectives(body.directives);
    if (selfCheck === MemoizeDirectiveState.Enabled) return true;
    if (selfCheck === MemoizeDirectiveState.Disabled) return false;

    const parentWithDirective = fn.findParent(parentPath => {
      if (parentPath.isBlockStatement() || parentPath.isProgram()) {
        const directiveCheck = checkExplicitMemoizeDirectives(
          parentPath.node.directives,
        );
        return MEMOIZE_ENABLED_OR_DISABLED_STATES.has(directiveCheck);
      }
      return false;
    });

    if (!parentWithDirective) return true;
    const parentDirectiveCheck = checkExplicitMemoizeDirectives(
      (parentWithDirective.node as t.Program | t.BlockStatement).directives,
    );
    return MEMOIZE_ENABLED_OR_UNDEFINED_STATES.has(parentDirectiveCheck);
  }
  return false;
}

function checkExplicitMemoizeDirectives(
  directives: Array<t.Directive>,
): MemoizeDirectiveState {
  if (findDirectiveEnablingMemoization(directives).length) {
    return MemoizeDirectiveState.Enabled;
  }
  if (findDirectiveDisablingMemoization(directives).length) {
    return MemoizeDirectiveState.Disabled;
  }
  return MemoizeDirectiveState.Undefined;
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

function isHookName(s: string): boolean {
  return /^use[A-Z0-9]/.test(s);
}

function getReactFunctionType(id: t.Identifier | null): ReactFunctionType {
  if (id != null) {
    if (isHookName(id.name)) {
      return 'Hook';
    }

    const isPascalCaseNameSpace = /^[A-Z].*/;
    if (isPascalCaseNameSpace.test(id.name)) {
      return 'Component';
    }
  }
  return 'Other';
}

function getFunctionIdentifier(
  fn:
    | NodePath<t.FunctionDeclaration>
    | NodePath<t.ArrowFunctionExpression>
    | NodePath<t.FunctionExpression>,
): t.Identifier | null {
  if (fn.isArrowFunctionExpression()) {
    return null;
  }
  const id = fn.get('id');
  return Array.isArray(id) === false && id.isIdentifier() ? id.node : null;
}

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
  let count = 0;
  const withIdentifier = (id: t.Identifier | null): t.Identifier => {
    if (id != null && id.name != null) {
      return id;
    } else {
      return t.identifier(`anonymous_${count++}`);
    }
  };
  try {
    // Extract the first line to quickly check for custom test directives
    const pragma = source.substring(0, source.indexOf('\n'));
    const config = parseConfigPragmaForTests(pragma);
    const parsedFunctions = parseFunctions(source, language);
    for (const func of parsedFunctions) {
      const id = withIdentifier(getFunctionIdentifier(func.fn));
      const fnName = id.name;
      if (!func.compilationEnabled) {
        upsert({
          kind: 'ast',
          fnName,
          name: 'CodeGen',
          value: {
            type: 'FunctionDeclaration',
            id:
              func.fn.isArrowFunctionExpression() ||
              func.fn.isFunctionExpression()
                ? withIdentifier(null)
                : func.fn.node.id,
            async: func.fn.node.async,
            generator: !!func.fn.node.generator,
            body: func.fn.node.body as t.BlockStatement,
            params: func.fn.node.params,
          },
        });
        continue;
      }
      for (const result of runPlayground(
        func.fn,
        {
          ...config,
          customHooks: new Map([...COMMON_HOOKS]),
        },
        getReactFunctionType(id),
      )) {
        switch (result.kind) {
          case 'ast': {
            upsert({
              kind: 'ast',
              fnName,
              name: result.name,
              value: {
                type: 'FunctionDeclaration',
                id: withIdentifier(result.value.id),
                async: result.value.async,
                generator: result.value.generator,
                body: result.value.body,
                params: result.value.params,
              },
            });
            break;
          }
          case 'hir': {
            upsert({
              kind: 'hir',
              fnName,
              name: result.name,
              value: printFunctionWithOutlined(result.value),
            });
            break;
          }
          case 'reactive': {
            upsert({
              kind: 'reactive',
              fnName,
              name: result.name,
              value: printReactiveFunctionWithOutlined(result.value),
            });
            break;
          }
          case 'debug': {
            upsert({
              kind: 'debug',
              fnName,
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
      }
    }
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
  return [{kind: 'ok', results}, language];
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
        variant: 'message',
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
