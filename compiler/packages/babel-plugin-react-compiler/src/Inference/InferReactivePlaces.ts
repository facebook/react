/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  BlockId,
  Effect,
  HIRFunction,
  Identifier,
  IdentifierId,
  Place,
  computePostDominatorTree,
  getHookKind,
  isStableType,
  isUseOperator,
} from '../HIR';
import {PostDominator} from '../HIR/Dominator';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {
  findDisjointMutableValues,
  isMutable,
} from '../ReactiveScopes/InferReactiveScopeVariables';
import DisjointSet from '../Utils/DisjointSet';
import {assertExhaustive} from '../Utils/utils';

/*
 * Infers which `Place`s are reactive, ie may *semantically* change
 * over the course of the component/hook's lifetime. Places are reactive
 * if they derive from source source of reactivity, which includes the
 * following categories.
 *
 * ## Props
 *
 * Props may change so they're reactive:
 *
 * ## Hooks
 *
 * Hooks may access state or context, which can change so they're reactive.
 *
 * ## Mutation with reactive operands
 *
 * Any value that is mutated in an instruction that also has reactive operands
 * could cause the modified value to capture a reference to the reactive value,
 * making the mutated value reactive.
 *
 * Ex:
 * ```
 * function Component(props) {
 *    const x = {}; // not yet reactive
 *    x.y = props.y;
 * }
 * ```
 *
 * Here `x` is modified in an instruction that has a reactive operand (`props.y`)
 * so x becomes reactive.
 *
 * ## Conditional assignment based on a reactive condition
 *
 * Conditionally reassigning a variable based on a condition which is reactive means
 * that the value being assigned could change, hence that variable also becomes
 * reactive.
 *
 * ```
 * function Component(props) {
 *    let x;
 *    if (props.cond) {
 *      x = 1;
 *    } else {
 *      x = 2;
 *    }
 *    return x;
 * }
 * ```
 *
 * Here `x` is never assigned a reactive value (it is assigned the constant 1 or 2) but
 * the condition, `props.cond`, is reactive, and therefore `x` could change reactively too.
 *
 *
 * # Algorithm
 *
 * The algorithm uses a fixpoint iteration in order to propagate reactivity "forward" through
 * the control-flow graph. We track whether each IdentifierId is reactive and terminate when
 * there are no changes after a given pass over the CFG.
 *
 * Note that in Forget it's possible to create a "readonly" reference to a value where
 * the reference is created within that value's mutable range:
 *
 * ```javascript
 * const x = [];
 * const z = [x];
 * x.push(props.input);
 *
 * return <div>{z}</div>;
 * ```
 *
 * Here `z` is never used to mutate the value, but it is aliasing `x` which
 * is mutated after the creation of the alias. The pass needs to account for
 * values which become reactive via mutability, and propagate this reactivity
 * to these readonly aliases. Using forward data flow is insufficient since
 * this information needs to propagate "backwards" from the `x.push(props.input)`
 * to the previous `z = [x]` line. We use a fixpoint iteration even if the
 * program has no back edges to accomplish this.
 */
export function inferReactivePlaces(fn: HIRFunction): void {
  const reactiveIdentifiers = new ReactivityMap(findDisjointMutableValues(fn));
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    reactiveIdentifiers.markReactive(place);
  }

  const postDominators = computePostDominatorTree(fn, {
    includeThrowsAsExitNode: false,
  });
  const postDominatorFrontierCache = new Map<BlockId, Set<BlockId>>();

  function isReactiveControlledBlock(id: BlockId): boolean {
    let controlBlocks = postDominatorFrontierCache.get(id);
    if (controlBlocks === undefined) {
      controlBlocks = postDominatorFrontier(fn, postDominators, id);
      postDominatorFrontierCache.set(id, controlBlocks);
    }
    for (const blockId of controlBlocks) {
      const controlBlock = fn.body.blocks.get(blockId)!;
      switch (controlBlock.terminal.kind) {
        case 'if':
        case 'branch': {
          if (reactiveIdentifiers.isReactive(controlBlock.terminal.test)) {
            return true;
          }
          break;
        }
        case 'switch': {
          if (reactiveIdentifiers.isReactive(controlBlock.terminal.test)) {
            return true;
          }
          for (const case_ of controlBlock.terminal.cases) {
            if (
              case_.test !== null &&
              reactiveIdentifiers.isReactive(case_.test)
            ) {
              return true;
            }
          }
          break;
        }
      }
    }
    return false;
  }

  do {
    const identifierMapping = new Map<Identifier, Identifier>();
    for (const [, block] of fn.body.blocks) {
      let hasReactiveControl = isReactiveControlledBlock(block.id);

      for (const phi of block.phis) {
        if (reactiveIdentifiers.isReactiveIdentifier(phi.id)) {
          // Already marked reactive on a previous pass
          continue;
        }
        let isPhiReactive = false;
        for (const [, operand] of phi.operands) {
          if (reactiveIdentifiers.isReactiveIdentifier(operand)) {
            isPhiReactive = true;
            break;
          }
        }
        if (isPhiReactive) {
          reactiveIdentifiers.markReactiveIdentifier(phi.id);
        } else {
          for (const [pred] of phi.operands) {
            if (isReactiveControlledBlock(pred)) {
              reactiveIdentifiers.markReactiveIdentifier(phi.id);
              break;
            }
          }
        }
      }
      for (const instruction of block.instructions) {
        const {value} = instruction;
        let hasReactiveInput = false;
        /*
         * NOTE: we want to mark all operands as reactive or not, so we
         * avoid short-circuting here
         */
        for (const operand of eachInstructionValueOperand(value)) {
          const reactive = reactiveIdentifiers.isReactive(operand);
          hasReactiveInput ||= reactive;
        }

        /**
         * Hooks and the 'use' operator are sources of reactivity because
         * they can access state (for hooks) or context (for hooks/use).
         *
         * Technically, `use` could be used to await a non-reactive promise,
         * but we are conservative and assume that the value could be reactive.
         */
        if (
          value.kind === 'CallExpression' &&
          (getHookKind(fn.env, value.callee.identifier) != null ||
            isUseOperator(value.callee.identifier))
        ) {
          hasReactiveInput = true;
        } else if (
          value.kind === 'MethodCall' &&
          (getHookKind(fn.env, value.property.identifier) != null ||
            isUseOperator(value.property.identifier))
        ) {
          hasReactiveInput = true;
        }

        if (hasReactiveInput) {
          for (const lvalue of eachInstructionLValue(instruction)) {
            if (isStableType(lvalue.identifier)) {
              continue;
            }
            reactiveIdentifiers.markReactive(lvalue);
          }
        }
        if (hasReactiveInput || hasReactiveControl) {
          for (const operand of eachInstructionValueOperand(value)) {
            switch (operand.effect) {
              case Effect.Capture:
              case Effect.Store:
              case Effect.ConditionallyMutate:
              case Effect.Mutate: {
                if (isMutable(instruction, operand)) {
                  const resolvedId = identifierMapping.get(operand.identifier);
                  if (resolvedId !== undefined) {
                    reactiveIdentifiers.markReactiveIdentifier(resolvedId);
                  }
                  reactiveIdentifiers.markReactive(operand);
                }
                break;
              }
              case Effect.Freeze:
              case Effect.Read: {
                // no-op
                break;
              }
              case Effect.Unknown: {
                CompilerError.invariant(false, {
                  reason: 'Unexpected unknown effect',
                  description: null,
                  loc: operand.loc,
                  suggestions: null,
                });
              }
              default: {
                assertExhaustive(
                  operand.effect,
                  `Unexpected effect kind \`${operand.effect}\``,
                );
              }
            }
          }
        }

        switch (value.kind) {
          case 'LoadLocal': {
            identifierMapping.set(
              instruction.lvalue.identifier,
              value.place.identifier,
            );
            break;
          }
          case 'PropertyLoad':
          case 'ComputedLoad': {
            const resolvedId =
              identifierMapping.get(value.object.identifier) ??
              value.object.identifier;
            identifierMapping.set(instruction.lvalue.identifier, resolvedId);
            break;
          }
          case 'LoadContext': {
            identifierMapping.set(
              instruction.lvalue.identifier,
              value.place.identifier,
            );
            break;
          }
        }
      }
      for (const operand of eachTerminalOperand(block.terminal)) {
        reactiveIdentifiers.isReactive(operand);
      }
    }
  } while (reactiveIdentifiers.snapshot());
}

/*
 * Computes the post-dominator frontier of @param block. These are immediate successors of nodes that
 * post-dominate @param targetId and from which execution may not reach @param block. Intuitively, these
 * are the earliest blocks from which execution branches such that it may or may not reach the target block.
 */
function postDominatorFrontier(
  fn: HIRFunction,
  postDominators: PostDominator<BlockId>,
  targetId: BlockId,
): Set<BlockId> {
  const visited = new Set<BlockId>();
  const frontier = new Set<BlockId>();
  const targetPostDominators = postDominatorsOf(fn, postDominators, targetId);
  for (const blockId of [...targetPostDominators, targetId]) {
    if (visited.has(blockId)) {
      continue;
    }
    visited.add(blockId);
    const block = fn.body.blocks.get(blockId)!;
    for (const pred of block.preds) {
      if (!targetPostDominators.has(pred)) {
        // The predecessor does not always reach this block, we found an item on the frontier!
        frontier.add(pred);
      }
    }
  }
  return frontier;
}

function postDominatorsOf(
  fn: HIRFunction,
  postDominators: PostDominator<BlockId>,
  targetId: BlockId,
): Set<BlockId> {
  const result = new Set<BlockId>();
  const visited = new Set<BlockId>();
  const queue = [targetId];
  while (queue.length) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);
    const current = fn.body.blocks.get(currentId)!;
    for (const pred of current.preds) {
      const predPostDominator = postDominators.get(pred) ?? pred;
      if (predPostDominator === targetId || result.has(predPostDominator)) {
        result.add(pred);
      }
      queue.push(pred);
    }
  }
  return result;
}

class ReactivityMap {
  hasChanges: boolean = false;
  reactive: Set<IdentifierId> = new Set();

  /**
   * Sets of mutably aliased identifiers — these are the same foundation for determining
   * reactive scopes a few passes later. The actual InferReactiveScopeVariables pass runs
   * after LeaveSSA, which artificially merges mutable ranges in cases such as declarations
   * that are later reassigned. Here we use only the underlying sets of mutably aliased values.
   *
   * Any identifier that has a mapping in this disjoint set will be treated as a stand in for
   * its canonical identifier in all cases, so that any reactivity flowing into one identifier of
   * an alias group will effectively make the whole alias group (all its identifiers) reactive.
   */
  aliasedIdentifiers: DisjointSet<Identifier>;

  constructor(aliasedIdentifiers: DisjointSet<Identifier>) {
    this.aliasedIdentifiers = aliasedIdentifiers;
  }

  isReactive(place: Place): boolean {
    const reactive = this.isReactiveIdentifier(place.identifier);
    if (reactive) {
      place.reactive = true;
    }
    return reactive;
  }

  isReactiveIdentifier(inputIdentifier: Identifier): boolean {
    const identifier =
      this.aliasedIdentifiers.find(inputIdentifier) ?? inputIdentifier;
    return this.reactive.has(identifier.id);
  }

  markReactive(place: Place): void {
    place.reactive = true;
    this.markReactiveIdentifier(place.identifier);
  }

  markReactiveIdentifier(inputIdentifier: Identifier): void {
    const identifier =
      this.aliasedIdentifiers.find(inputIdentifier) ?? inputIdentifier;
    if (!this.reactive.has(identifier.id)) {
      this.hasChanges = true;
      this.reactive.add(identifier.id);
    }
  }

  snapshot(): boolean {
    const hasChanges = this.hasChanges;
    this.hasChanges = false;
    return hasChanges;
  }
}
