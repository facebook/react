/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { invariant } from "../CompilerError";

// *******************************************************************************************
// *******************************************************************************************
// ************************************* Core Data Model *************************************
// *******************************************************************************************
// *******************************************************************************************

// option 1: control dependencies using CFG (done in Joe's PR)
// option 2: reachability (did execution reach this point last time, if not calculate)
// option 3: push change variable calculation to point of use (more allocations)
// option 4: compute intermediates

// AST -> (lowering) -> HIR -> (dep analysis) -> Reactive Scopes -> (scheduling?) -> HIR -> (codegen) -> AST

/**
 * A location in a source file, intended to be used for providing diagnostic information and
 * transforming code while preserving source information (ie to emit source maps).
 *
 * `GeneratedSource` indicates that there is no single source location from which the code derives.
 *
 */
export const GeneratedSource = Symbol();
export type SourceLocation = t.SourceLocation | typeof GeneratedSource;

/**
 * A React function defines a computation that takes some set of reactive
 * inputs (eg props, hook arguments) and returns a result (JSX, hook return
 * value). It is composed of one or more Reactive Scopes, where each
 * Reactive Scope takes a set of reactive inputs and produces one *or more*
 * result values. The idea is that each Reactive Scope is responsible for
 * producing its result values whenever its inputs change: scopes contain
 * instructions to produce the result values, deriving from the inputs
 * as well as from the results of other scopes.
 *
 * A React function comprises a Reactive Scope responsible for producing the
 * return value of the function, plus additional scopes that the return scopes
 * may depend upon (transitively).
 */
export type ReactFunction = {
  loc: SourceLocation;
  id: Identifier | null;
  params: Array<Place>;
  returnScope: ScopeId;
  scopes: Map<ScopeId, ReactiveScope>;
};

/**
 * A function declaration including its path
 */
export type HIRFunction = {
  loc: SourceLocation;
  id: Identifier | null;
  params: Array<Place>;
  body: HIR;
  generator: boolean;
  async: boolean;
};

/**
 * Each reactive scope may have its own control-flow, so the instructions form
 * a control-flow graph. The graph comprises a set of basic blocks which reference
 * each other via terminal statements, as well as a reference to the entry block.
 */
export type HIR = {
  entry: BlockId;

  /**
   * Basic blocks are stored as a map to aid certain operations that need to
   * lookup blocks by their id. However, the order of the items in the map is
   * reverse postorder, that is, barring cycles, predecessors appear before
   * successors. This is designed to facilitate forward data flow analysis.
   */
  blocks: Map<BlockId, BasicBlock>;
};

/**
 * Each basic block within an instruction graph contains zero or more instructions
 * followed by a terminal node. Note that basic blocks always execute consecutively,
 * there can be no branching within a block other than for an exception. Exceptions
 * can occur pervasively and React runtime is responsible for resetting state when
 * an exception occurs, therefore the block model only represents explicit throw
 * statements and not implicit exceptions which may occur.
 */
export type BasicBlock = {
  id: BlockId;
  instructions: Array<Instruction>;
  terminal: Terminal;
  preds: Set<BasicBlock>;
  phis: Set<Phi>;
};

/**
 * Terminal nodes generally represent statements that affect control flow, such as
 * for-of, if-else, return, etc.
 */
export type Terminal =
  | ThrowTerminal
  | ReturnTerminal
  | GotoTerminal
  | IfTerminal
  | SwitchTerminal
  | ForTerminal
  | WhileTerminal;

export type ThrowTerminal = { kind: "throw"; value: Place; id: InstructionId };

export type ReturnTerminal = {
  kind: "return";
  loc: SourceLocation;
  value: Place | null;
  id: InstructionId;
};

export type GotoTerminal = {
  kind: "goto";
  block: BlockId;
  variant: GotoVariant;
  id: InstructionId;
};

export enum GotoVariant {
  Break = "Break",
  Continue = "Continue",
}

export type IfTerminal = {
  kind: "if";
  test: Place;
  consequent: BlockId;
  alternate: BlockId;
  fallthrough: BlockId | null;
  id: InstructionId;
};

export type SwitchTerminal = {
  kind: "switch";
  test: Place;
  cases: Array<{ test: Place | null; block: BlockId }>;
  fallthrough: BlockId | null;
  id: InstructionId;
};

export type WhileTerminal = {
  kind: "while";
  loc: SourceLocation;
  test: BlockId;
  loop: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
};

export type ForTerminal = {
  kind: "for";
  init: BlockId;
  test: BlockId;
  update: BlockId;
  loop: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
};

/**
 * Instructions generally represent expressions but with all nesting flattened away,
 * such that all operands to each instruction are either primitive values OR are
 * references to a place, which may be a temporary that holds the results of a
 * previous instruction. So `foo(bar(a))` would decompose into two instructions,
 * one to store `tmp0 = bar(a)`, one for `foo(tmp0)`.
 *
 * Instructions generally store their value into a Place, though some instructions
 * may not produce a value that is necessary to track (for example, class definitions)
 * or may occur only for side-effects (many expression statements).
 */
export type Instruction = {
  id: InstructionId;
  lvalue: LValue | null;
  value: InstructionValue;
  loc: SourceLocation;
};

export type LValue = {
  place: Place;
  kind: InstructionKind;
};

export enum InstructionKind {
  /**
   * const declaration
   */
  Const = "Const",
  /**
   * let declaration
   */
  Let = "Let",
  /**
   * assing a new value to a let binding
   */
  Reassign = "Reassign",
}

/**
 * A value that may be assigned to a place. Similar to instructions, values
 * are not recursive: complex values such as objects or arrays are always
 * defined by Instructions to construct a temporary Place, and then referring
 * to that Place.
 *
 * Values are therefore only a Place or a primitive value.
 */
export type InstructionValue =
  | (InstructionData & { loc: SourceLocation })
  | Place;

export type Phi = {
  kind: "Phi";
  id: Identifier;
  operands: Map<BasicBlock, Identifier>;
};

export type InstructionData =
  | { kind: "Primitive"; value: number | boolean | string | null | undefined }
  | { kind: "JSXText"; value: string }
  | {
      kind: "BinaryExpression";
      operator: t.BinaryExpression["operator"];
      left: Place;
      right: Place;
    }
  | { kind: "NewExpression"; callee: Place; args: Array<Place> }
  | { kind: "CallExpression"; callee: Place; args: Array<Place> }
  | { kind: "UnaryExpression"; operator: string; value: Place }
  | {
      kind: "JsxExpression";
      tag: Place;
      props: Map<string, Place>;
      children: Array<Place> | null; // null === no children
    }
  | {
      kind: "ObjectExpression";
      properties: Map<string, Place> | null; // null === empty object
    }
  | { kind: "ArrayExpression"; elements: Array<Place> }
  | { kind: "JsxFragment"; children: Array<Place> }

  /**
   * Catch-all for statements such as type imports, nested class declarations, etc
   * which are not directly represented, but included for completeness and to allow
   * passing through in codegen.
   */
  | {
      kind: "OtherStatement";
      node: t.Statement | t.JSXSpreadChild | t.JSXFragment;
    };

/**
 * A place where data may be read from / written to:
 * - a variable (identifier)
 * - a path into an identifier
 */
export type Place = {
  kind: "Identifier";
  identifier: Identifier;
  memberPath: Array<string> | null;
  effect: Effect;
  loc: SourceLocation;
  type: Type;
};

/**
 * A primitive value with a specific (constant) value.
 */
export type Primitive = {
  kind: "Primitive";
  value: number | boolean | string | null | undefined;
  loc: SourceLocation;
};

/*
 * Range in which an identifier is mutable. Start and End refer to Instruction.id.
 * TODO(gsn): Type Instruction.id better and use it here.
 *
 * Start is inclusive, End is exclusive (ie, end is the "first" instruction for which
 * the value is not mutable).
 */
export type MutableRange = {
  start: InstructionId;
  end: InstructionId;
};

/**
 * Represents a user-defined variable (has a name) or a temporary variable (no name).
 */
export type Identifier = {
  // unique value to distinguish a variable, since name is not guaranteed to exist or be unique
  id: IdentifierId;
  // null for temporaries. name is primarily used for debugging.
  name: string | null;
  // The range for which this variable is mutable
  mutableRange: MutableRange;
  // The ID of the reactive scope which will compute this value. Multiple variables may have
  // the same scope id.
  scope: ReactiveScope | null;
};

/**
 * Distinguish between different kinds of values relevant to inference purposes:
 * see the main docblock for the module for details.
 */
export enum ValueKind {
  MaybeFrozen = "maybefrozen",
  Frozen = "frozen",
  Immutable = "immutable",
  Mutable = "mutable",
}

/**
 * The effect with which a value is modified.
 */
export enum Effect {
  // Default value: not allowed after lifetime inference
  Unknown = "<unknown>",
  // This reference freezes the value (corresponds to a place where codegen should emit a freeze instruction)
  Freeze = "freeze",
  // This reference reads the value
  Read = "read",
  // This reference may write to (mutate) the value
  Mutate = "mutate",
}

export type ReactiveScope = {
  id: ScopeId;
  range: MutableRange;
  dependencies: Set<Place>;
};

/**
 * Simulated opaque type for BlockIds to prevent using normal numbers as block ids
 * accidentally.
 */
const opaqueBlockId = Symbol();
export type BlockId = number & { [opaqueBlockId]: "BlockId" };

export function makeBlockId(id: number): BlockId {
  invariant(
    id >= 0 && Number.isInteger(id),
    "Expected block id to be a non-negative integer"
  );
  return id as BlockId;
}

/**
 * Simulated opaque type for ScopeIds to prevent using normal numbers as scope ids
 * accidentally.
 */
const opaqueScopeId = Symbol();
export type ScopeId = number & { [opaqueScopeId]: "ScopeId" };

export function makeScopeId(id: number): ScopeId {
  invariant(
    id >= 0 && Number.isInteger(id),
    "Expected block id to be a non-negative integer"
  );
  return id as ScopeId;
}

/**
 * Simulated opaque type for IdentifierId to prevent using normal numbers as ids
 * accidentally.
 */
const opaqueIdentifierId = Symbol();
export type IdentifierId = number & { [opaqueIdentifierId]: "IdentifierId" };

export function makeIdentifierId(id: number): IdentifierId {
  invariant(
    id >= 0 && Number.isInteger(id),
    "Expected identifier id to be a non-negative integer"
  );
  return id as IdentifierId;
}

/**
 * Simulated opaque type for InstructionId to prevent using normal numbers as ids
 * accidentally.
 */
const opaqueInstructionId = Symbol();
export type InstructionId = number & { [opaqueInstructionId]: "IdentifierId" };

export function makeInstructionId(id: number): InstructionId {
  invariant(
    id >= 0 && Number.isInteger(id),
    "Expected instruction id to be a non-negative integer"
  );
  return id as InstructionId;
}

export enum Type {
  Any,
  Primitive,
  Object,
}
