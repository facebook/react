/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import DisjointSet from "./DisjointSet";
import {
  BasicBlock,
  BlockId,
  Capability,
  HIR,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionValue,
  makeScopeId,
  Place,
  ReactFunction,
  ReactiveScope,
  ScopeId,
  Terminal,
} from "./HIR";
import todo from "./todo";

// import * as t from "@babel/types";

/**
 * Converts a function in standard HIR form into a reactive function, breaking down
 * the function's body to determine a set of minimal scopes which define computation
 * of sub-expressions in the input. A separate phase can then reconstruct an HIR
 * function given the reactive function using various heuristics for codegen.
 *
 * ## algorithm
 * We want to find minimal sets of instructions which build up values. This
 * involves determining which values "construct together". Values that construct
 * together derive from:
 * * mutable accesses that may capture one value into another:
 *   `x = y`, `foo(x, y)`
 *   The intuition is that because a mutable reference can be captured, we have
 *   to assume that further modifications of one value may affect the other and
 *   vice versa, so their construction must be grouped together.
 *
 * * constructing independent values across the same control flow path:
 *   `let x = ..., y = ...; if (cond) {x.a = ...; y.b = ...; }`
 *   The intuition here is that we don't want to repeat control-flow constructs,
 *   (esp loops) so values that are constructed across multiple basic blocks
 *   get grouped together.
 *
 * Once we've grouped values that "construct together", we can then create one
 * scope per group. we iterate back over the CFG, and for each instruction/terminal
 * we figure out which group that belongs to, based on the set of values its creating,
 * and push it onto the appropriate group's CFG.
 *
 * as an extra optimization to avoid creating scopes for primitives, we can try to
 * infer that instructions that produce primitives don't get their own scope.
 * so in `tmp1 = a * b; tmp2 = tmp1 * 3; tmp3 = tmp2 > 10`, we can say that tmp1/2/3
 * are all primitives, so they should be grouped together even though they don't
 * mutate together, and even though there's no control flow.
 *
 * we'll also need use-def analysis (or similar) to avoid reassignment of variables
 * causing overly large grouping of scopes. we really care about the *values* that
 * are being constructed together, not the variables. so `foo(x, y)` conjoins x and y,
 * but if we later `x = {}; x.a = 5`, that later assignment and modification should *not*
 * conjoin with `y`. for now, we accept that these cases will be treated as conjoined and
 * grouped together.
 */
export default function analyzeScopes(fn: HIRFunction): ReactFunction {
  // naive but trivially correct version
  const returnScopeId = makeScopeId(0);
  const scopes: Map<ScopeId, ReactiveScope> = new Map();
  scopes.set(returnScopeId, {
    inputs: new Set(
      fn.params.map((param) => ({
        kind: "Identifier",
        value: param,
        memberPath: null,
        capability: Capability.Frozen,
        path: null as any,
      }))
    ),
    outputs: new Set(),
    instructions: fn.body,
  });
  return {
    path: fn.path,
    id: fn.id,
    params: fn.params,
    returnScope: returnScopeId,
    scopes,
  };
}

/**
 * ```javascript
 * function Component({items}) {
 *   const renderedItems = [];
 *   const seen = new Set();
 *   for (const item of items) {
 *     renderedItems.push(<div>{item}</div>);
 *     seen.add(item);
 *   }
 *   return <Child items={renderedItems} seen={seen} />;
 * }
 * ```
 * Iterate over the IR in tree order (similar to codegen) - single pass with recursion.
 * Build a stack of control points and mutable values, associate mutable values with
 * control points that occur between each other. control points also naturally group
 * together, ie for a continue within a loop.
 *
 *
 * Ideas toward an algorithm:
 * - Track the lifetime for which each variable (value, really) is mutable.
 * - Values with overlapping mutable lifetimes are conjoined ("memoize together").
 * - Keep a stack of mutated values which we can walk. But *also* store block terminals in this stack.
 *   When you walk back up the stack to find previous mutations of a value, add all the terminals
 *   along the way until finding it as dependencies. eg set.union(mutValue, terminal).
 *   Two values that mutate across the same control points will union with the same terminal,
 *   and get conjoined.
 *
 * Eg in the following, `renderedItems` and `seen` have overlapping mutable lifetimes:
 *
 * ```javascript
 * function Component({items, maxItems}) {
 *   const renderedItems = [];                                // new-mutable renderedItems
 *   const seen = new Set();                                  // new-mutable seen
 *   const max = Math.max(0, maxItems);                       // new-mutable max; read-frozen maxItems
 *   for (const item of items) {                              // read-frozen items; control point
 *     if (item == null || seen.has(item)) {                  // mutable seen; read-frozen item; control point
 *       continue;                                            // control point
 *     }
 *
 *     seen.add(item);                                        // mutable seen; read-frozen item
 *                                                            // finding prev `mut seen` hops the above control points
 *     renderedItems.push(<div>{item}</div>);                 // mutable renderedItems; read-frozen item
 *                                                            // finding prev `mut renderedItems` hops the above control points
 *     if (renderedItems.length >= max) {                     // read-frozen max; read-mutable renderedItems
 *       break;
 *     }
 *   }
 *   const count = renderedItems.length;                      // read-frozen renderedItems
 *   return <div><h1>{count} Items</h1>{renderedItems}</div>; // read-frozen renderedItems
 * }
 *
 * function Component({items, maxItems}) {
 *   // scope 0 (inputs: maxItems, outputs: max)
 *   const c_maxItems = ...;
 *   let max = c_max_items ? Math.max(0, maxItems) : ...;
 *   const c_max = ...;
 *
 *   // scope 1 (inputs: items, max, ouputs: renderedItems, seen, count)
 *   const c_items = ...;
 *   let renderedItems;
 *   let seen;
 *   let count;
 *   if (c_max || c_items) {
 *     renderedItems = ....;
 *     seen = ...;
 *     for (const item of items) {
 *       if (item == null || seen.has(item)) {                  // read-mutable seen; read-frozen item; control point
 *         continue;                                            // control point
 *       }
 *       seen.add(item);                                        // mut-mutable seen; read-frozen item
 *       renderedItems.push(<div>{item}</div>);                 // mut-mutable renderedItems; read-frozen item
 *       if (renderedItems.length >= max) {                     // read-frozen max; read-mutable renderedItems
 *         break;
 *       }
 *     }
 *     count = renderedItems.length;
 *   } else {
 *      // populate from cache
 *   }
 *
 *   // scope 2 (inputs: count, ouputs: div)
 *   const c_count = ...;
 *   let h1;
 *   if (c_count) {
 *     h1 = <h1>{count}</h1>
 *   } // else from cache
 *
 *   // scope 3 (inputs: h1, renderedItems, outputs: outer div)
 *   const c_h1 = ...;
 *   const c_renderedItems = ...;
 *   let ret;
 *   if (c_h1 || c_renderedItems) {
 *     ret = <div>{h1}{renderedItems}</div>; // read-frozen renderedItems
 *   } // else from cache
 *   return ret;
 * }
 * ```
 */

function analyze(fn: HIRFunction): ReactFunction {
  const returnScopeId = makeScopeId(0);
  const scopes: Map<ScopeId, ReactiveScope> = new Map();

  const block = fn.body.blocks.get(fn.body.entry)!;
  const context = new Context(fn.body);
  analyzeBlock(context, fn.body.entry, block);
  context.analyzeControls();

  return {
    path: fn.path,
    id: fn.id,
    params: fn.params,
    returnScope: returnScopeId,
    scopes,
  };
}

class Context {
  #blocks: Map<IdentifierId, Set<BasicBlock>> = new Map();
  #groups: DisjointSet<IdentifierId | Instruction | BasicBlock> =
    new DisjointSet();
  body: HIR;

  constructor(body: HIR) {
    this.body = body;
  }

  union(items: Array<IdentifierId | Instruction>, block: BasicBlock) {
    this.#groups.union(items);
    for (const item of items) {
      if (typeof item === "number") {
        // IdentifierId
        let set = this.#blocks.get(item);
        if (set == null) {
          set = new Set();
          this.#blocks.set(item, set);
        }
        set.add(block);
      }
    }
  }

  /**
   * Find items that participate in control flow together
   */
  analyzeControls() {
    const mergeSets: Array<Array<BasicBlock>> = [];
    const blocks: Map<BlockId, BasicBlock> = new Map();
    this.#groups.forEach((prevItem, prevGroup) => {
      this.#groups.forEach((nextItem, nextGroup) => {
        if (
          prevGroup === nextGroup ||
          typeof prevItem !== "number" ||
          typeof nextItem !== "number"
        ) {
          // Already part of the same group, by definition this includes item === nextItem
          return;
        }
        const prevBlocks = this.#blocks.get(prevItem)!;
        const nextBlocks = this.#blocks.get(nextItem)!;

        const overlap = [];
        for (const block of prevBlocks) {
          if (nextBlocks.has(block)) {
            overlap.push(block);
          }
        }
        if (overlap.length > 1) {
          mergeSets.push(overlap);
        }
      });
    });
    for (const set of mergeSets) {
      this.#groups.union(set);
    }
  }
}

function analyzeBlock(cx: Context, id: BlockId, block: BasicBlock) {
  for (const instr of block.instructions) {
    const instrValue = instr.value;
    let mutables: Array<IdentifierId | Instruction> = [];
    switch (instrValue.kind) {
      case "JSXText":
      case "Primitive": {
        // no mutable values
        break;
      }
      case "Identifier": {
        const value = getMutable(instrValue);
        if (value !== null) {
          mutables.push(value);
        }
        break;
      }
      case "UnaryExpression": {
        const value = getMutable(instrValue.value);
        if (value !== null) {
          mutables.push(value);
        }
        break;
      }
      case "BinaryExpression": {
        const left = getMutable(instrValue.left);
        const right = getMutable(instrValue.right);
        if (left !== null) {
          mutables.push(left);
        }
        if (right !== null) {
          mutables.push(right);
        }
        break;
      }
      case "ArrayExpression": {
        for (const _element of instrValue.elements) {
          const element = getMutable(_element);
          if (element !== null) {
            mutables.push(element);
          }
        }
        break;
      }
      case "ObjectExpression": {
        if (instrValue.properties !== null) {
          for (const _value of Object.values(instrValue.properties)) {
            const value = getMutable(_value);
            if (value !== null) {
              mutables.push(value);
            }
          }
        }
        break;
      }
      case "JsxExpression": {
        const tag = getMutable(instrValue.tag);
        if (tag !== null) {
          mutables.push(tag);
        }
        for (const _prop of Object.values(instrValue.props)) {
          const prop = getMutable(_prop);
          if (prop !== null) {
            mutables.push(prop);
          }
        }
        if (instrValue.children !== null) {
          for (const _child of instrValue.children) {
            const child = getMutable(_child);
            if (child !== null) {
              mutables.push(child);
            }
          }
        }
        break;
      }
      case "NewExpression":
      case "CallExpression": {
        const callee = getMutable(instrValue.callee);
        if (callee !== null) {
          mutables.push(callee);
        }
        for (const _arg of instrValue.args) {
          const arg = getMutable(_arg);
          if (arg !== null) {
            mutables.push(arg);
          }
        }
        break;
      }
      case "OtherStatement": {
        // no-op for the value itself
        break;
      }
      default: {
        assertExhaustive(
          instrValue,
          `Unexpected instruction kind '${
            (instrValue as any as InstructionValue).kind
          }'`
        );
      }
    }
    const place = instr.place !== null ? getMutable(instr.place) : null;
    invariant(
      instr.place === null ||
        instr.place.kind !== "Identifier" ||
        place !== null,
      "Expected instruction assignment target to be inferred as mutable if present."
    );
    if (place !== null) {
      mutables.push(place);
    }
    if (mutables.length !== 0) {
      mutables.push(instr);
      cx.union(mutables, block);
    }
  }
  switch (block.terminal.kind) {
    case "if": {
      const consequent = cx.body.blocks.get(block.terminal.consequent)!;
      analyzeBlock(cx, block.terminal.consequent, consequent);
      const alternate = cx.body.blocks.get(block.terminal.alternate)!;
      analyzeBlock(cx, block.terminal.alternate, alternate);
      if (
        block.terminal.fallthrough !== null &&
        block.terminal.fallthrough !== block.terminal.alternate
      ) {
        const fallthrough = cx.body.blocks.get(block.terminal.fallthrough)!;
        analyzeBlock(cx, block.terminal.fallthrough, fallthrough);
      }
      break;
    }
    case "switch": {
      todo("implement scope analysis for switch statements");
    }
    case "throw":
    case "return":
    case "goto": {
      // no-op
      break;
    }
    default: {
      assertExhaustive(
        block.terminal,
        `Unexpected terminal kind '${(block.terminal as any as Terminal).kind}'`
      );
    }
  }
}

function getMutable(place: Place): IdentifierId | null {
  return place.kind === "Identifier" && place.capability === Capability.Mutable
    ? place.value.id
    : null;
}
