/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parse, ParserPlugin } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import {
  CompilerError,
  CompilerErrorDetail,
  Effect,
  ErrorSeverity,
  Hook,
  parseConfigPragma,
  printHIR,
  printReactiveFunction,
  run,
  ValueKind,
} from "babel-plugin-react-forget";
import { ReactFunctionType } from "babel-plugin-react-forget/dist/HIR/Environment";
import clsx from "clsx";
import invariant from "invariant";
import { useSnackbar } from "notistack";
import { useDeferredValue, useMemo } from "react";
import { useMountEffect } from "../../hooks";
import { defaultStore } from "../../lib/defaultStore";
import {
  createMessage,
  initStoreFromUrlOrLocalStorage,
  MessageLevel,
  MessageSource,
  type Store,
} from "../../lib/stores";
import { useStore, useStoreDispatch } from "../StoreContext";
import Input from "./Input";
import {
  CompilerOutput,
  default as Output,
  PrintedCompilerPipelineValue,
} from "./Output";

function parseFunctions(
  source: string,
): Array<
  NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >
> {
  const items: Array<
    NodePath<
      t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
    >
  > = [];
  try {
    const isFlow = source
      .trim()
      .split("\n", 1)[0]
      .match(/\s*\/\/\s*\@flow\s*/);
    let type_transform: ParserPlugin;
    if (isFlow) {
      type_transform = "flow";
    } else {
      type_transform = "typescript";
    }
    const ast = parse(source, {
      plugins: [type_transform, "jsx"],
      sourceType: "module",
    });
    traverse(ast, {
      FunctionDeclaration(nodePath) {
        items.push(nodePath);
        nodePath.skip();
      },
      ArrowFunctionExpression(nodePath) {
        items.push(nodePath);
        nodePath.skip();
      },
      FunctionExpression(nodePath) {
        items.push(nodePath);
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

const COMMON_HOOKS: Array<[string, Hook]> = [
  [
    "useFragment",
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    "usePaginationFragment",
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    "useRefetchableFragment",
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    "useLazyLoadQuery",
    {
      valueKind: ValueKind.Frozen,
      effectKind: Effect.Freeze,
      noAlias: true,
      transitiveMixedData: true,
    },
  ],
  [
    "usePreloadedQuery",
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

function getReactFunctionType(
  id: NodePath<t.Identifier | null | undefined>,
): ReactFunctionType {
  if (id && id.node && id.isIdentifier()) {
    if (isHookName(id.node.name)) {
      return "Hook";
    }

    const isPascalCaseNameSpace = /^[A-Z].*/;
    if (isPascalCaseNameSpace.test(id.node.name)) {
      return "Component";
    }
  }
  return "Other";
}

function compile(source: string): CompilerOutput {
  const results = new Map<string, PrintedCompilerPipelineValue[]>();
  const error = new CompilerError();
  const upsert = (result: PrintedCompilerPipelineValue) => {
    const entry = results.get(result.name);
    if (Array.isArray(entry)) {
      entry.push(result);
    } else {
      results.set(result.name, [result]);
    }
  };
  try {
    // Extract the first line to quickly check for custom test directives
    const pragma = source.substring(0, source.indexOf("\n"));
    const config = parseConfigPragma(pragma);

    for (const fn of parseFunctions(source)) {
      if (!fn.isFunctionDeclaration()) {
        error.pushErrorDetail(
          new CompilerErrorDetail({
            reason: `Unexpected function type ${fn.node.type}`,
            description:
              "Playground only supports parsing function declarations",
            severity: ErrorSeverity.Todo,
            loc: fn.node.loc ?? null,
            suggestions: null,
          }),
        );
        continue;
      }

      const id = fn.get("id");
      for (const result of run(
        fn,
        {
          ...config,
          customHooks: new Map([...COMMON_HOOKS]),
        },
        getReactFunctionType(id),
        null,
      )) {
        const fnName = fn.node.id?.name ?? null;
        switch (result.kind) {
          case "ast": {
            upsert({
              kind: "ast",
              fnName,
              name: result.name,
              value: {
                type: "FunctionDeclaration",
                id: result.value.id,
                async: result.value.async,
                generator: result.value.generator,
                body: result.value.body,
                params: result.value.params,
              },
            });
            break;
          }
          case "hir": {
            upsert({
              kind: "hir",
              fnName,
              name: result.name,
              value: printHIR(result.value.body),
            });
            break;
          }
          case "reactive": {
            upsert({
              kind: "reactive",
              fnName,
              name: result.name,
              value: printReactiveFunction(result.value),
            });
            break;
          }
          case "debug": {
            upsert({
              kind: "debug",
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
    // error might be an invariant violation or other runtime error
    // (i.e. object shape that is not CompilerError)
    if (err instanceof CompilerError && err.details.length > 0) {
      error.details.push(...err.details);
    } else {
      // Handle unexpected failures by logging (to get a stack trace)
      // and reporting
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
    return { kind: "err", results, error: error };
  }
  return { kind: "ok", results };
}

export default function Editor() {
  const store = useStore();
  const deferredStore = useDeferredValue(store);
  const dispatchStore = useStoreDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const compilerOutput = useMemo(
    () => compile(deferredStore.source),
    [deferredStore.source],
  );

  useMountEffect(() => {
    let mountStore: Store;
    try {
      mountStore = initStoreFromUrlOrLocalStorage();
    } catch (e) {
      invariant(e instanceof Error, "Only Error may be caught.");
      enqueueSnackbar(e.message, {
        variant: "message",
        ...createMessage(
          "Bad URL - fell back to the default Playground.",
          MessageLevel.Info,
          MessageSource.Playground,
        ),
      });
      mountStore = defaultStore;
    }
    dispatchStore({
      type: "setStore",
      payload: { store: mountStore },
    });
  });

  return (
    <>
      <div className="relative flex basis top-14">
        <div
          style={{ minWidth: 650 }}
          className={clsx("relative sm:basis-1/4")}
        >
          <Input
            errors={
              compilerOutput.kind === "err" ? compilerOutput.error.details : []
            }
          />
        </div>
        <div className={clsx("flex sm:flex flex-wrap")}>
          <Output store={deferredStore} compilerOutput={compilerOutput} />
        </div>
      </div>
    </>
  );
}
