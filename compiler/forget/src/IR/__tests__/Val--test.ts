import { parse } from "@babel/parser";
import traverse, { Binding, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import {
  BindingVal,
  createBindingVal,
  createRef,
  RefKind,
  ValKind,
} from "../Val";

describe("ReactValue", () => {
  let def: Binding, ref: NodePath<t.Identifier | t.JSXIdentifier>;
  traverse(parse(`var x; use(x)`), {
    Identifier(ident) {
      if (ident.node.name !== "x") return;
      if (ident.isReferenced()) {
        ref = ident;
      } else {
        def = ident.scope.bindings["x"];
      }
    },
  });

  it("immutable stable value", () => {
    const v = createBindingVal(def, ValKind.Unknown, true, true);
    expect(v.toString()).toMatchInlineSnapshot(`"_x"`);

    const r = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(r.toString()).toMatchInlineSnapshot(`"&_x"`);

    // Cannot borrow an immutable val as mutable so it still ended as immutable
    const mr = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(mr.toString()).toMatchInlineSnapshot(`"&_x"`);
  });

  it("immutable unstable value", () => {
    const v = createBindingVal(def, ValKind.Unknown, true, false);
    expect(v.toString()).toMatchInlineSnapshot(`"x"`);

    const r = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(r.toString()).toMatchInlineSnapshot(`"&x"`);

    // Cannot borrow an immutable val as mutable so it still ended as immutable
    const mr = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(mr.toString()).toMatchInlineSnapshot(`"&x"`);
  });

  it("mutable stable value", () => {
    const v = createBindingVal(def, ValKind.Unknown, false, true);
    expect(v.toString()).toMatchInlineSnapshot(`"mut _x"`);

    // Can borrow a mutable value as immutable.
    const r = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(r.toString()).toMatchInlineSnapshot(`"&_x"`);

    const mr = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(mr.toString()).toMatchInlineSnapshot(`"&_x"`);
  });

  it("mutable unstable value", () => {
    const v = createBindingVal(def, ValKind.Unknown, false, false);
    expect(v.toString()).toMatchInlineSnapshot(`"mut x"`);

    // Can borrow a mutable value as immutable.
    const r = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(r.toString()).toMatchInlineSnapshot(`"&x"`);

    const mr = createRef<BindingVal>(ref, v, RefKind.Unknown);
    expect(mr.toString()).toMatchInlineSnapshot(`"&x"`);
  });
});
