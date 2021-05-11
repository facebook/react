import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import * as IR from "../IR";

/**
 * A control flow graph comprises of a set of basic blocks plus the entry block id.
 */
export type CFG = {
  blocks: Map<BlockId, BasicBlock>;
  entry: BlockId;
};

export type BlockId = number;

/**
 * A sequence of zero or more statements that will execute consecutively (barring exceptions)
 * followed by a terminal node. The terminal ends the *block*, not the function, though some
 * terminals such as throw or return may also exit from the function.
 */
export type BasicBlock = {
  body: Array<NodePath<t.Statement | t.Expression>>;
  terminal: Terminal;
  parents: Set<IR.FuncTopLevel>;
};

/**
 * Union of all possible terminal nodes.
 */
export type Terminal =
  | ReturnTerminal
  | GotoTerminal
  | ThrowTerminal
  | IfTerminal
  | SwitchTerminal;

/**
 * Models a `return <expression>`, terminating the block by returning the given value.
 */
export type ReturnTerminal = {
  kind: "return";
  value: NodePath<t.Expression> | null;

  /**
   * The block that would otherwise be reached if the return were not present.
   * This is only non-null if the fallthrough block is reachable by some other
   * control-flow path.
   * Represents the block that would otherwise be reached if this return were
   * not present, along with the test conditions that are checked to decide if
   * this return should be taken. The fallthrough object is only non-null if
   * the fallthrough block is reachable by some other control-flow path.
   */
  fallthrough: {
    block: BlockId;
    tests: Array<NodePath<t.Expression>> | null;
  } | null;
};

/**
 * Models control-flow that unconditionally jumps to another block. In general
 * Goto is only used if there is more than one control flow path that will reach
 * the target block: if block A is the only block that can flow into block B,
 * block A and B would be constructed as a single block.
 */
export type GotoTerminal = {
  kind: "goto";
  block: BlockId;

  /**
   * The block that would otherwise be reached if the return were not present.
   * This is only non-null if the fallthrough block is reachable by some other
   * control-flow path.
   * Represents the block that would otherwise be reached if this return were
   * not present, along with the test conditions that are checked to decide if
   * this return should be taken. The fallthrough object is only non-null if
   * the fallthrough block is reachable by some other control-flow path.
   */
  fallthrough: {
    block: BlockId;
    tests: Array<NodePath<t.Expression>> | null;
  } | null;
};

/**
 * Models a `throw <expression>`. Because this is an exception case, the actual value
 * being thrown does not matter and isn't modeled.
 */
export type ThrowTerminal = {
  kind: "throw";
};

/**
 * Models a if/else conditional branch, which can occur from explicit `if` statements or
 * from implicit conditionals such as whether to (re)enter or exit a loop.
 */
export type IfTerminal = {
  kind: "if";
  /**
   * The condition being tested to determine whether to enter the consequent (if test is truthy)
   * or else the alternate
   */
  test: NodePath<t.Expression>;
  consequent: BlockId;
  alternate: BlockId;
};

/**
 * Models a switch statement, where a test value is checked against multiple cases. Default cases
 * and fallthrough is made explicit: there will always be exactly one case with a null `test`, which
 * represents the default case. Fallthrough is modeled explicitly via gotos in the case blocks.
 */
export type SwitchTerminal = {
  kind: "switch";
  /**
   * The expression being evaluated against the possible cases
   */
  test: NodePath<t.Expression>;
  cases: Array<{
    /**
     * The expression to test to determine if this block should be entered
     * null indicates a `default` case, which (bc JS!) may not be the last case.
     */
    test: NodePath<t.Expression> | null;
    block: BlockId;
  }>;
};
