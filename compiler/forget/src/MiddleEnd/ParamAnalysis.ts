/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import type { Function } from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import type { CompilerContext } from "../CompilerContext";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import { PassKind, PassName } from "../Pass";

/**
 * Parameter Analysis.
 *
 * This middle end pass analyze the "FormalParameters" position of ReactFunc and
 * resolves bindings considered as {@link IR.FuncInputs}, including "props" to
 * Components and (under conservatively approximation) all parameters to Hooks.
 *
 * Note that treating parameters to Hooks same as "props" to Components imposed
 * a new rule of Hooks in that passing arguments to Hooks is effectively
 * considered as "immutable borrowing" in the jargons of Rust.
 */
export default {
  name: PassName.ParamAnalysis,
  kind: PassKind.IRFunc as const,
  run,
};

export function run(
  irFunc: IR.Func,
  func: NodePath<Function>,
  context: CompilerContext
) {
  // https://tc39.es/ecma262/#prod-FormalParameters
  const paramsNode = func.node.params;

  // FormalParameters : [empty]
  // Fast path for syntactically empty param e.g. `function foo()`.
  // Note that this is incomplete because or the existence of `arguments`.
  if (paramsNode.length === 0) {
    irFunc.paramKind = IR.FuncParamKind.Empty;
    return;
  }

  // component Foo(...)
  if (irFunc.kind === IR.FuncKind.Component) {
    // We assume the first param as Component Props.
    const propsParam = func.get("params")[0];

    switch (propsParam.node.type) {
      case "ObjectPattern": {
        // component Foo({...})
        irFunc.paramKind = IR.FuncParamKind.NonSimple;
        break;
      }
      case "RestElement": {
        // FormalParameters : FunctionRestParameter
        // component Foo(...rest)
        irFunc.paramKind = IR.FuncParamKind.NonSimple;
        context.createDiagnostic({
          code: "E0001",
          path: propsParam,
          context: null,
        });
        break;
      }
      case "ArrayPattern":
      case "AssignmentPattern":
      case "Identifier":
      case "TSParameterProperty": {
        irFunc.paramKind = IR.FuncParamKind.Simple;
        context.createDiagnostic({
          code: "E0002",
          path: propsParam,
          context: null,
        });
        break;
      }
      default:
        assertExhaustive(propsParam.node, "Unhandled propsParam");
    }
  }

  // Currently, we collect all BindingIdentifiers discovered under
  // FormalParameters as inputs for all ReactFuncKinds.
  //
  // TODO: It's likely we don't need to return a map. Refining them is enough.
  //
  // TODO: In the future, we should specialize for each kinds, e.g.
  // - for kind Component, exclude `ref` in `forwardRef((props, ref) => ...)`.
  // - for paramKind Simple, track at least one-level down to support
  //   `let {p1, p2} = props`, `props.foo` or even `props["foo"]`.
  // - and only do the most conservative for kind Unknown.
  const paramBindings = getParamBindings(irFunc, func);

  // function foo({})
  // function foo({}, [])
  // Specialize empty destructuring.
  if (paramBindings.size === 0) {
    irFunc.paramKind = IR.FuncParamKind.Empty;
    return;
  }
}

/**
 * A helper function to get the Bindings of kind "param" defined in @param func.
 */
function getParamBindings(
  irFunc: IR.Func,
  func: NodePath<Function>
): Map<string, IR.BindingVal> {
  const { bindings } = func.scope;
  const map = new Map();
  for (const [name, b] of Object.entries(bindings)) {
    //@ts-ignore: The type of `kind` defined the @type package is not complete.
    //See: https://github.com/babel/babel/blob/main/packages/babel-traverse/src/scope/binding.ts#L5
    if (b.kind === "param") {
      const val = irFunc.env.decls.get(name);
      invariant(
        typeof val !== "undefined",
        "Param must exists in environment."
      );

      val.refineTo(IR.ValKind.Param, true, false);
      map.set(name, val);
    }
  }
  return map;
}
