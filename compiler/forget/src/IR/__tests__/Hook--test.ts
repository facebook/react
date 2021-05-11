/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { CallExpression, OptionalCallExpression } from "@babel/types";
import * as Hook from "../Hook";

/**
 * ReactHook Unit Tests
 *
 * This unit test only focus on the correctness around
 * {@link ReactHook.HookCall.resolve}.
 */

describe("ReactHook", () => {
  it("Not hook", () => {
    // Not hook name.
    expect(parseHook("userFetch()")).toBe(undefined);

    // Lowercased namespace
    expect(parseHook("x.useState()")).toBe(undefined);
    expect(parseHook("jest.useFakeTimer()")).toBe(undefined);

    // Chaining member expression
    expect(parseHook("Module?.Other.useMagic()")).toBe(undefined);
    expect(parseHook("X.X.useState()")).toBe(undefined);
    expect(parseHook("X.React.useState()")).toBe(undefined);
    expect(parseHook("React.X.useState()")).toBe(undefined);
  });

  it("Builtin hooks", () => {
    // Orphan builtins.
    expect(parseHook("useState()")).toBe(Hook.UseState);
    expect(parseHook("useReducer()")).toBe(Hook.UseReducer);
    expect(parseHook("useContext()")).toBe(Hook.UseContext);
    expect(parseHook("useRef()")).toBe(Hook.UseRef);
    expect(parseHook("useEffect()")).toBe(Hook.UseEffect);
    expect(parseHook("useLayoutEffect()")).toBe(Hook.UseLayoutEffect);
    expect(parseHook("useCallback()")).toBe(Hook.UseCallback);
    expect(parseHook("useMemo()")).toBe(Hook.UseMemo);

    // React-namespaced builtins.
    expect(parseHook("React.useState()")).toBe(Hook.UseState);
  });

  test.each([
    // Unknown hooks.
    "useUnkown()",
    "React.useUnknown()",

    // Not (or not well) React-namespaced.
    "X.useState()",

    // Different custom hooks
    "useMagic()",
    "Module.useMagic()",
    "Module?.useMagic()",
  ])("`%s` is a custom hook", (code) => {
    const maybeHook = parseHook(code);
    expect(maybeHook !== undefined && Hook.isCustomHook(maybeHook)).toBe(true);
  });
});

/**
 * Test helper attempting to parse and resolve the first CallExpression in
 * @param code as Hook. @returns the hook if resolved, or undefined otherwise.
 */
function parseHook(code: string): Hook.Hook | undefined {
  let maybeCall: NodePath<CallExpression | OptionalCallExpression> | undefined;
  traverse(parse(code), {
    CallExpression(call) {
      maybeCall = call;
      call.stop();
    },
    OptionalCallExpression(call) {
      maybeCall = call;
      call.stop();
    },
  });
  return maybeCall && Hook.HookCall.resolve(maybeCall)?.hook;
}
