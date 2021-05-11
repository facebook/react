/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import invariant from "invariant";
import { Func } from "../Func";
import { JSXTag, JSXTreeBuilder } from "../JSX";
import { JSXTagVal } from "../Val";

/**
 * React JSX Unit Tests
 */
describe("ReactJSX", () => {
  it("JSXElement", () => {
    expect(parseJSX("<View />")).toMatchInlineSnapshot(`
      {
        "JSX <View>": [],
      }
    `);
    expect(parseJSX("<View a='a' />")).toMatchInlineSnapshot(`
      {
        "JSX <View>": [],
      }
    `);
    expect(parseJSX("<View a={a} />")).toMatchInlineSnapshot(`
      {
        "JSX <View>": [
          "Expr a",
        ],
      }
    `);
    expect(parseJSX("<View>a</View>")).toMatchInlineSnapshot(`
      {
        "JSX <View>": [],
      }
    `);
    expect(parseJSX("<View>{a}</View>")).toMatchInlineSnapshot(`
      {
        "JSX <View>": [
          "Expr a",
        ],
      }
    `);
    expect(parseJSX("<ListView><View /></ListView>")).toMatchInlineSnapshot(`
      {
        "JSX <ListView>": [
          {
            "JSX <View>": [],
          },
        ],
      }
    `);
    expect(parseJSX("<ListView><View><Text/></View></ListView>"))
      .toMatchInlineSnapshot(`
      {
        "JSX <ListView>": [
          {
            "JSX <View>": [
              {
                "JSX <Text>": [],
              },
            ],
          },
        ],
      }
    `);
    expect(
      parseJSX(`
      <ListView a={a}>
       {a}
        <View b={b}>
          {b}
          <Text c={c}/>
        </View>
      </ListView>
    `)
    ).toMatchInlineSnapshot(`
      {
        "JSX <ListView>": [
          "Expr a",
          "Expr a",
          {
            "JSX <View>": [
              "Expr b",
              "Expr b",
              {
                "JSX <Text>": [
                  "Expr c",
                ],
              },
            ],
          },
        ],
      }
    `);
  });

  it("JSXFragment", () => {
    expect(parseJSX("<></>")).toMatchInlineSnapshot(`
      {
        "JSX <>": [],
      }
    `);
    expect(
      parseJSX(`
      <>
       1
       {a}
       <View/>
       <View b={b}/>
      </>
    `)
    ).toMatchInlineSnapshot(`
      {
        "JSX <>": [
          "Expr a",
          {
            "JSX <View>": [],
          },
          {
            "JSX <View>": [
              "Expr b",
            ],
          },
        ],
      }
    `);
  });
});

function parseJSX(jsxCode: string): JSXTagVal | undefined {
  // Wrap under a func to preserve the invariant that parentalFunc exists.
  let code = `
    function Comp(){ return ${jsxCode}}
  `;

  let maybeFunc;
  let maybeJSXTree: NodePath<JSXTag> | undefined;
  traverse(parse(code, { plugins: ["jsx"] }), {
    JSXElement(jsxEle) {
      maybeJSXTree = jsxEle;
      jsxEle.stop();
    },
    JSXFragment(jsxFrag) {
      maybeJSXTree = jsxFrag;
      jsxFrag.stop();
    },
    Function(func) {
      maybeFunc = func;
    },
  });

  invariant(maybeFunc, "Wrapped here.");
  return (
    maybeJSXTree &&
    new JSXTreeBuilder(maybeJSXTree, new Func(maybeFunc)).build()
  );
}
