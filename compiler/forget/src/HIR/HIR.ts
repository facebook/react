/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import invariant from "invariant";
import { Environment } from "./Environment";
import { Type } from "./Types";

// *******************************************************************************************
// *******************************************************************************************
// ************************************* Core Data Model *************************************
// *******************************************************************************************
// *******************************************************************************************

// AST -> (lowering) -> HIR -> (analysis) -> Reactive Scopes -> (codegen) -> AST

/**
 * A location in a source file, intended to be used for providing diagnostic information and
 * transforming code while preserving source information (ie to emit source maps).
 *
 * `GeneratedSource` indicates that there is no single source location from which the code derives.
 */
export const GeneratedSource = Symbol();
export type SourceLocation = t.SourceLocation | typeof GeneratedSource;

/**
 * A React function defines a computation that takes some set of reactive inputs
 * (props, hook arguments) and return a result (JSX, hook return value). Unlike
 * HIR, the data model is tree-shaped:
 *
 * ReactFunction
 *   ReactiveBlock
 *     ReactiveBlockScope*
 *      Place* (dependencies)
 *      (ReactiveInstruction | ReactiveTerminal)*
 *
 * Where ReactiveTerminal may recursively contain zero or more ReactiveBlocks.
 *
 * Each ReactiveBlockScope describes a set of dependencies as well as the instructions (and terminals)
 * within that scope.
 */
export type ReactiveFunction = {
  loc: SourceLocation;
  id: Identifier | null;
  params: Array<Place>;
  generator: boolean;
  async: boolean;
  body: ReactiveBlock;
  env: Environment;
};

export type ReactiveScopeBlock = {
  kind: "scope";
  scope: ReactiveScope;
  instructions: ReactiveBlock;
};

export type ReactiveBlock = Array<ReactiveStatement>;

export type ReactiveStatement =
  | ReactiveInstructionStatement
  | ReactiveTerminalStatement
  | ReactiveScopeBlock;

export type ReactiveInstructionStatement = {
  kind: "instruction";
  instruction: ReactiveInstruction;
};

export type ReactiveTerminalStatement<
  Tterminal extends ReactiveTerminal = ReactiveTerminal
> = {
  kind: "terminal";
  terminal: Tterminal;
  label: BlockId | null;
};

export type ReactiveInstruction = {
  id: InstructionId;
  lvalue: Place | null;
  value: ReactiveValue;
  loc: SourceLocation;
};

export type ReactiveValue =
  | InstructionValue
  | ReactiveLogicalValue
  | ReactiveSequenceValue
  | ReactiveTernaryValue
  | ReactiveOptionalCallValue;

export type ReactiveLogicalValue = {
  kind: "LogicalExpression";
  operator: t.LogicalExpression["operator"];
  left: ReactiveValue;
  right: ReactiveValue;
  loc: SourceLocation;
};

export type ReactiveTernaryValue = {
  kind: "ConditionalExpression";
  test: ReactiveValue;
  consequent: ReactiveValue;
  alternate: ReactiveValue;
  loc: SourceLocation;
};

export type ReactiveSequenceValue = {
  kind: "SequenceExpression";
  instructions: Array<ReactiveInstruction>;
  id: InstructionId;
  value: ReactiveValue;
  loc: SourceLocation;
};

export type ReactiveOptionalCallValue = {
  kind: "OptionalCall";
  id: InstructionId;
  call: ReactiveValue;
  optional: boolean;
  loc: SourceLocation;
};

export type ReactiveTerminal =
  | ReactiveBreakTerminal
  | ReactiveContinueTerminal
  | ReactiveReturnTerminal
  | ReactiveThrowTerminal
  | ReactiveSwitchTerminal
  | ReactiveDoWhileTerminal
  | ReactiveWhileTerminal
  | ReactiveForTerminal
  | ReactiveIfTerminal;

export type ReactiveBreakTerminal = {
  kind: "break";
  label: BlockId | null;
  id: InstructionId | null;
  implicit: boolean;
};
export type ReactiveContinueTerminal = {
  kind: "continue";
  label: BlockId | null;
  id: InstructionId;
  implicit: boolean;
};
export type ReactiveReturnTerminal = {
  kind: "return";
  value: Place | null;
  id: InstructionId;
};
export type ReactiveThrowTerminal = {
  kind: "throw";
  value: Place;
  id: InstructionId;
};
export type ReactiveSwitchTerminal = {
  kind: "switch";
  test: Place;
  cases: Array<{
    test: Place | null;
    block: ReactiveBlock | void;
  }>;
  id: InstructionId;
};
export type ReactiveDoWhileTerminal = {
  kind: "do-while";
  loop: ReactiveBlock;
  test: ReactiveValue;
  id: InstructionId;
};
export type ReactiveWhileTerminal = {
  kind: "while";
  test: ReactiveValue;
  loop: ReactiveBlock;
  id: InstructionId;
};
export type ReactiveForTerminal = {
  kind: "for";
  init: ReactiveValue;
  test: ReactiveValue;
  update: ReactiveValue;
  loop: ReactiveBlock;
  id: InstructionId;
};
export type ReactiveIfTerminal = {
  kind: "if";
  test: Place;
  consequent: ReactiveBlock;
  alternate: ReactiveBlock | null;
  id: InstructionId;
};

/**
 * A function lowered to HIR form, ie where its body is lowered to an HIR control-flow graph
 */
export type HIRFunction = {
  loc: SourceLocation;
  id: Identifier | null;
  env: Environment;
  params: Array<Place>;
  context: Array<Place>;
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
export type BlockKind = "block" | "value" | "loop";
export type BasicBlock = {
  kind: BlockKind;
  id: BlockId;
  instructions: Array<Instruction>;
  terminal: Terminal;
  preds: Set<BlockId>;
  phis: Set<Phi>;
};

/**
 * Terminal nodes generally represent statements that affect control flow, such as
 * for-of, if-else, return, etc.
 */
export type Terminal =
  | UnsupportedTerminal
  | ThrowTerminal
  | ReturnTerminal
  | GotoTerminal
  | IfTerminal
  | BranchTerminal
  | SwitchTerminal
  | ForTerminal
  | DoWhileTerminal
  | WhileTerminal
  | LogicalTerminal
  | TernaryTerminal
  | OptionalCallTerminal;

/**
 * Terminal nodes allowed for a value block
 */
export type ValueTerminal = IfTerminal | GotoTerminal;
// A terminal that couldn't be lowered correctly.
export type UnsupportedTerminal = { kind: "unsupported"; id: InstructionId };
export type ThrowTerminal = { kind: "throw"; value: Place; id: InstructionId };
export type Case = { test: Place | null; block: BlockId };

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

export type BranchTerminal = {
  kind: "branch";
  test: Place;
  consequent: BlockId;
  alternate: BlockId;
  id: InstructionId;
};

export type SwitchTerminal = {
  kind: "switch";
  test: Place;
  cases: Case[];
  fallthrough: BlockId | null;
  id: InstructionId;
};

export type DoWhileTerminal = {
  kind: "do-while";
  loop: BlockId;
  test: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
  loc: SourceLocation;
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
  loc: SourceLocation;
  init: BlockId;
  test: BlockId;
  update: BlockId;
  loop: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
};

export type LogicalTerminal = {
  kind: "logical";
  operator: t.LogicalExpression["operator"];
  test: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
  loc: SourceLocation;
};

export type TernaryTerminal = {
  kind: "ternary";
  test: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
  loc: SourceLocation;
};

export type OptionalCallTerminal = {
  kind: "optional-call";
  // Whether the call itself is optional. If false, this means that the callee itself
  // is optionally evaluated (has some OptionalMemberExpresion) but the final call is
  // required (if the callee is not null/undefined).
  optional: boolean;
  test: BlockId;
  fallthrough: BlockId;
  id: InstructionId;
  loc: SourceLocation;
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
  lvalue: Place;
  value: InstructionValue;
  loc: SourceLocation;
};

export type LValue = {
  place: Place;
  kind: InstructionKind;
};

export type LValuePattern = {
  pattern: Pattern;
  kind: InstructionKind;
};

export type Pattern = ArrayPattern | ObjectPattern;

export type SpreadPattern = {
  kind: "Spread";
  place: Place;
};

export type ArrayPattern = {
  kind: "ArrayPattern";
  items: Array<Place | SpreadPattern>;
};

export type ObjectPattern = {
  kind: "ObjectPattern";
  properties: Array<ObjectProperty | SpreadPattern>;
};

export type ObjectProperty = {
  kind: "ObjectProperty";
  name: string; // TODO: make a Place
  place: Place;
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

function _staticInvariantInstructionValueHasLocation(
  value: InstructionValue
): SourceLocation {
  // If this fails, it is because a variant of InstructionValue is missing a .loc - add it!
  return value.loc;
}

export type Phi = {
  kind: "Phi";
  id: Identifier;
  operands: Map<BlockId, Identifier>;
  type: Type;
};

/**
 * Forget currently does not handle MethodCall correctly in
 * all cases. Specifically, we do not bind the receiver and method property
 * before calling to args. Until we add a SequenceExpression to inline all
 * instructions generated when lowering args, we have a limited representation
 * with some constraints.
 *
 * Forget currently makes these assumptions (checked in codegen):
 *  - {@link MethodCall.property} is a temporary produced by a PropertyLoad or ComputedLoad
 *    on {@link MethodCall.receiver}
 *  - {@link MethodCall.property} remains an rval (i.e. never promoted to a
 *    named identifier). We currently rely on this for codegen.
 *
 * Type inference does not currently guarantee that {@link MethodCall.property}
 * is a FunctionType.
 */
export type MethodCall = {
  kind: "MethodCall";
  receiver: Place;
  property: Place;
  args: Array<Place | SpreadPattern>;
  loc: SourceLocation;
};

/**
 * The value of a given instruction. Note that values are not recursive: complex
 * values such as objects or arrays are always defined by instructions to define
 * their operands (saving to a temporary), then passing those temporaries as
 * the operands to the final instruction (ObjectExpression, ArrayExpression, etc).
 *
 * Operands are therefore always a Place.
 */
export type InstructionValue =
  | {
      kind: "LoadLocal";
      place: Place;
      loc: SourceLocation;
    }
  | {
      kind: "DeclareLocal";
      lvalue: LValue;
      loc: SourceLocation;
    }
  | {
      kind: "StoreLocal";
      lvalue: LValue;
      value: Place;
      loc: SourceLocation;
    }
  | {
      kind: "Destructure";
      lvalue: LValuePattern;
      value: Place;
      loc: SourceLocation;
    }
  | {
      kind: "Primitive";
      value: number | boolean | string | null | undefined;
      loc: SourceLocation;
    }
  | { kind: "JSXText"; value: string; loc: SourceLocation }
  | {
      kind: "BinaryExpression";
      operator: t.BinaryExpression["operator"];
      left: Place;
      right: Place;
      loc: SourceLocation;
    }
  | {
      kind: "NewExpression";
      callee: Place;
      args: Array<Place | SpreadPattern>;
      loc: SourceLocation;
    }
  | {
      kind: "CallExpression";
      callee: Place;
      args: Array<Place | SpreadPattern>;
      loc: SourceLocation;
    }
  | MethodCall
  | {
      kind: "UnaryExpression";
      operator: string;
      value: Place;
      loc: SourceLocation;
    }
  | {
      kind: "TypeCastExpression";
      value: Place;
      type: t.TypeAnnotation;
      loc: SourceLocation;
    }
  | {
      kind: "JsxExpression";
      tag: Place;
      props: Array<JsxAttribute>;
      children: Array<Place> | null; // null === no children
      loc: SourceLocation;
    }
  | {
      kind: "ObjectExpression";
      properties: Array<ObjectProperty | SpreadPattern>;
      loc: SourceLocation;
    }
  | {
      kind: "ArrayExpression";
      elements: Array<Place | SpreadPattern>;
      loc: SourceLocation;
    }
  | { kind: "JsxFragment"; children: Array<Place>; loc: SourceLocation }
  | {
      kind: "RegExpLiteral";
      pattern: string;
      flags: string;
      loc: SourceLocation;
    }

  // store `object.property = value`
  | {
      kind: "PropertyStore";
      object: Place;
      property: string;
      value: Place;
      loc: SourceLocation;
    }
  // load `object.property`
  | {
      kind: "PropertyLoad";
      object: Place;
      property: string;
      optional: boolean;
      loc: SourceLocation;
    }
  // `delete object.property`
  | {
      kind: "PropertyDelete";
      object: Place;
      property: string;
      loc: SourceLocation;
    }

  // store `object[index] = value` - like PropertyStore but with a dynamic property
  | {
      kind: "ComputedStore";
      object: Place;
      property: Place;
      value: Place;
      loc: SourceLocation;
    }
  // load `object[index]` - like PropertyLoad but with a dynamic property
  | {
      kind: "ComputedLoad";
      object: Place;
      property: Place;
      loc: SourceLocation;
    }
  // `delete object[property]`
  | {
      kind: "ComputedDelete";
      object: Place;
      property: Place;
      loc: SourceLocation;
    }
  | { kind: "LoadGlobal"; name: string; loc: SourceLocation }
  | FunctionExpression
  | {
      kind: "TaggedTemplateExpression";
      tag: Place;
      value: { raw: string; cooked?: string };
      loc: SourceLocation;
    }
  | {
      kind: "TemplateLiteral";
      subexprs: Array<Place>;
      quasis: Array<{ raw: string; cooked?: string }>;
      loc: SourceLocation;
    }
  | {
      kind: "Await";
      value: Place;
      loc: SourceLocation;
    }
  /**
   * Catch-all for statements such as type imports, nested class declarations, etc
   * which are not directly represented, but included for completeness and to allow
   * passing through in codegen.
   */
  | {
      kind: "UnsupportedNode";
      node: t.Node;
      loc: SourceLocation;
    };

export type JsxAttribute =
  | { kind: "JsxSpreadAttribute"; argument: Place }
  | { kind: "JsxAttribute"; name: string; place: Place };

export type FunctionExpression = {
  kind: "FunctionExpression";
  name: string | null;
  dependencies: Array<Place>;
  loweredFunc: HIRFunction;
  expr: t.ArrowFunctionExpression | t.FunctionExpression;
  loc: SourceLocation;
};
/**
 * A place where data may be read from / written to:
 * - a variable (identifier)
 * - a path into an identifier
 */
export type Place = {
  kind: "Identifier";
  identifier: Identifier;
  effect: Effect;
  loc: SourceLocation;
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
  // unique value to distinguish a variable, since name is not guaranteed to
  // exist or be unique
  id: IdentifierId;
  // null for temporaries. name is primarily used for debugging.
  name: string | null;
  // The range for which this variable is mutable
  mutableRange: MutableRange;
  // The ID of the reactive scope which will compute this value. Multiple
  // variables may have the same scope id.
  scope: ReactiveScope | null;
  type: Type;
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
  Context = "context",
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
  // This reference reads and stores the value
  Capture = "capture",
  // This reference may write to (mutate) the value
  Mutate = "mutate",
  // This reference may alias to (mutate) the value
  Store = "store",
}

export type ReactiveScope = {
  id: ScopeId;
  range: MutableRange;
  dependencies: Set<ReactiveScopeDependency>;
  declarations: Map<IdentifierId, Identifier>;
  reassignments: Set<Identifier>;
};

export type ReactiveScopeDependency = {
  identifier: Identifier;
  path: Array<string>;
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

export function isObjectType(id: Identifier): boolean {
  return id.type.kind === "Object";
}

export function isPrimitiveType(id: Identifier): boolean {
  return id.type.kind === "Primitive";
}

export function isHookType(id: Identifier): boolean {
  return id.type.kind === "Hook";
}

export * from "./Types";
