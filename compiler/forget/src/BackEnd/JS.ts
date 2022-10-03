/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 *  JavaScript Generator.
 */

import { Node, NodePath, Scope } from "@babel/traverse";
import * as t from "@babel/types";
import { CompilerContext } from "../CompilerContext";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import * as LIR from "../LIR";

export type Code = Node[];

/**
 * "DSL" for writing memoCache manipulation.
 */
class MemoCache {
  static #RETURN_VALUE = 0;
  static #RETURN_INDEX = 1;

  entries: Map<LIR.MemoCache.EntryKey, LIR.MemoCache.Entry>;
  id: t.Identifier;
  hasRetIdx: boolean;
  #guardReads: boolean;

  constructor(
    lirMemoCache: LIR.MemoCache.MemoCache,
    context: CompilerContext,
    scope: Scope
  ) {
    this.#guardReads = context.opts.flags.guardReads;
    lirMemoCache.finializeIndices();
    this.entries = lirMemoCache.entries;
    if (scope.hasBinding("$")) {
      this.id = scope.generateUidIdentifier("$");
    } else {
      this.id = t.identifier("$");
    }

    invariant(
      lirMemoCache.retValPos != null,
      "retVal should always be allocated!"
    );
    this.hasRetIdx = lirMemoCache.retIdxPos != null;
    this.#guardReads = context.opts.flags.guardReads;
  }

  /**
   * `$[RETURN_INDEX] === index`
   */
  isMemoizedReturnIndex(index: number): t.Expression {
    return t.binaryExpression(
      "===",
      this.#cacheMember(MemoCache.#RETURN_INDEX),
      t.numericLiteral(index)
    );
  }

  /**
   * `$[RETURN_INDEX] = index`
   */
  writeReturnIndex(index: number): t.Expression {
    invariant(this.hasRetIdx, "Invalid call of writeReturnIndex");
    return this.#writeIndex(MemoCache.#RETURN_INDEX, t.numericLiteral(index));
  }

  /**
   * `$[RETURN_VALUE]`
   */
  readReturnValue(): t.Expression {
    return this.#readIndex(MemoCache.#RETURN_VALUE);
  }

  /**
   * `$[RETURN_VALUE] = value`
   */
  writeReturnValue(value: t.Expression): t.Expression {
    return this.#writeIndex(MemoCache.#RETURN_VALUE, value);
  }

  /**
   * `$[entry]`
   */
  read(entry: LIR.MemoCache.Entry): t.Expression {
    return this.#readIndex(entry.index);
  }

  /**
   * `$[entry] = value`
   */
  write(entry: LIR.MemoCache.Entry, value: t.Expression): t.Expression {
    return this.#writeIndex(entry.index, value);
  }

  /**
   * `$[entry] == $._`
   */
  isEmpty(entry: LIR.MemoCache.Entry): t.BinaryExpression {
    return t.binaryExpression(
      "===",
      this.#cacheMember(entry.index),
      t.memberExpression(this.id, t.identifier("_"))
    );
  }

  /**
   * `$[entry] !== value`
   */
  isChanged(
    entry: LIR.MemoCache.Entry,
    value: t.Expression
  ): t.BinaryExpression {
    return t.binaryExpression("!==", this.#cacheMember(entry.index), value);
  }

  #readIndex(index: number): t.Expression {
    if (this.#guardReads) {
      return t.callExpression(
        t.memberExpression(t.identifier("useMemoCache"), t.identifier("read")),
        [this.id, t.numericLiteral(index)]
      );
    } else {
      return this.#cacheMember(index);
    }
  }

  #writeIndex(index: number, value: t.Expression): t.Expression {
    return t.assignmentExpression("=", this.#cacheMember(index), value);
  }

  #cacheMember(index: number): t.MemberExpression {
    return t.memberExpression(this.id, t.numericLiteral(index), true);
  }
}
/**
 * JS Func
 */
export class Func {
  lir: LIR.Func;

  context: CompilerContext;

  /**
   * Code are owned by JS Func and are emitted by side effect for better perf.
   */
  code: Code;

  memoCache: MemoCache;
  changeVarIds: Map<string, t.Identifier>;

  constructor(lirFunc: LIR.Func, context: CompilerContext) {
    this.code = [];
    this.lir = lirFunc;
    this.context = context;
    this.memoCache = new MemoCache(
      this.lir.memoCache,
      this.context,
      this.lir.ir.ast.scope
    );
    this.changeVarIds = new Map();
  }

  emit(node: Node) {
    this.code.push(node);
  }

  /**
   * Helpers that generate the `useMemoCache` call
   * @returns
   *   let $ = useMemoCache(size)
   */
  useMemoCacheCall(size: number): t.Statement {
    return t.variableDeclaration("let", [
      t.variableDeclarator(
        /*id*/ this.memoCache.id,
        /*init*/ t.callExpression(
          /* callee*/ t.identifier("useMemoCache"),
          /*arguments*/ [t.numericLiteral(size)]
        )
      ),
    ]);
  }

  // Generate calls to utility function that freezes immut objects
  emitMakeReadOnly(val: IR.BindingVal) {
    if (this.context.opts.flags.addFreeze === true) {
      this.code.push(
        t.expressionStatement(
          t.callExpression(t.identifier("useMemoCache.makeReadOnly"), [
            val.binding.identifier,
          ])
        )
      );
    }
  }

  /**
   * Generate code materializing reactions
   * @returns
   *   let c_input = $[i] !== input; // compute the "change/reaction".
   *   $[i] = input;                 // replace caches.
   *
   * Or, with `.flags.condCache`:
   *   if (c_input) $[i] = input;
   */
  emitReactiveVal(val: IR.ReactiveVal) {
    const valIdent = val.binding.identifier;
    const changeVar = this.getChangeVar(valIdent.name);

    const entry = this.memoCache.entries.get(val);
    invariant(entry, "ReactiveVals are always cached.");

    // let c_var = $[i] !== var;
    this.code.push(
      t.variableDeclaration("let", [
        t.variableDeclarator(
          /*id*/ changeVar,
          this.memoCache.isChanged(entry, valIdent)
        ),
      ])
    );

    // $[i] = var
    const cacheReplacement = t.expressionStatement(
      this.memoCache.write(entry, valIdent)
    );

    if (this.context.opts.flags.condCache) {
      // if (c_var) $[i] = var;
      this.code.push(
        t.ifStatement(/*test*/ changeVar, /*consequent*/ cacheReplacement)
      );
    } else {
      this.code.push(cacheReplacement);
    }
  }

  /**
   * @return
   *   let output1, output2;
   */
  emitReactiveBlockOutputDecls(block: LIR.ReactiveBlock) {
    if (block.outputDecls.size > 0) {
      this.code.push(
        t.variableDeclaration(
          /*kind*/ "let",
          /*declarators*/ [...block.outputDecls.values()].map((output) =>
            t.variableDeclarator(/*id*/ output.binding.identifier)
          )
        )
      );
    }
  }

  /**
   * Generate code materializing {@link ReactiveBlock}
   * @return
   *   let output1, output2;
   *   if ( Reactions(Inputs) ) {
   *     ...body
   *     $[i1] = output1;
   *     $[i2] = output2;
   *   } else {
   *     output1 = $[i1]
   *     output2 = $[i2]
   *   }
   *
   * OR (when there is only outputs w/o any inputs)
   * @return
   *   let output1, output2;
   *   if ( $.isEmpty(i1) ) {
   *     ...body
   *     $[i1] = output1;
   *     $[i2] = output2;
   *   } else {
   *     output1 = $[i1]
   *     output2 = $[i2]
   *   }
   */
  emitReactiveBlock(block: LIR.ReactiveBlock) {
    const hasNoInputs = block.inputs.size === 0;
    const hasNoOutputs = block.outputs.size === 0;

    let cond: t.Expression;
    if (hasNoInputs) {
      if (hasNoOutputs) {
        // If there is neither inputs nor outputs then it likely doesn't contribute
        // to rendering at all. The safest thing may just be keeping them as-is.
        for (const instr of block.body) {
          if (instr.ir.returnStmts.size > 0) {
            for (const [ret, retIdx] of instr.ir.returnStmts) {
              ret.replaceWith(this.genRewrittenReturn(ret, retIdx));
            }
            this.code.push(instr.ast.node);
          } else {
            this.code.push(instr.ast.node);
          }
        }
        return;
      }

      const firstOutput = block.outputs.values().next().value;
      const firstOutputEntry = this.memoCache.entries.get(firstOutput);
      invariant(firstOutputEntry, "ReactiveBlock outputs are always cached.");
      cond = this.memoCache.isEmpty(firstOutputEntry);
    } else {
      cond = this.genReactions(block.inputs);
    }

    // let output1, output2, ...
    this.emitReactiveBlockOutputDecls(block);

    let evalBody: t.Statement[] = [];
    let skipBody: t.Statement[] = [];

    // ...body
    for (const instr of block.body) {
      instr.ir.jsxTreeRoots.forEach((root) => this.rewriteExprInJSXTree(root));

      if (instr.ir.isDecl) {
        for (const rewrittenInstr of this.genDeclWithOutputsRewritten(instr)) {
          evalBody.push(rewrittenInstr);
        }
      } else {
        if (instr.ir.returnStmts.size > 0) {
          for (const [ret, retIdx] of instr.ir.returnStmts) {
            ret.replaceWith(this.genRewrittenReturn(ret, retIdx));
            skipBody.push(this.genReturnReplay(retIdx));
          }
          evalBody.push(instr.ast.node);
        } else {
          evalBody.push(instr.ast.node);
        }
      }
    }
    for (const output of block.outputs) {
      const entry = this.memoCache.entries.get(output);
      invariant(entry, "ReactiveBlock outputs are always cached.");

      // Since the binding is re-assigned in the generated code
      if (output.binding.kind == "const") {
        output.binding.kind = "let";
      }

      // $[i] = output
      evalBody.push(
        t.expressionStatement(
          this.memoCache.write(entry, output.binding.identifier)
        )
      );

      // output = $[i]
      skipBody.push(
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            output.binding.identifier,
            this.memoCache.read(entry)
          )
        )
      );
    }

    if (this.context.opts.flags.guardHooks) {
      const startLazyCall = t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier("useMemoCache"),
            t.identifier("startLazy")
          ),
          []
        )
      );
      const endLazyCall = t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier("useMemoCache"),
            t.identifier("endLazy")
          ),
          []
        )
      );
      evalBody = [
        t.tryStatement(
          t.blockStatement([startLazyCall, ...evalBody]),
          null,
          t.blockStatement([endLazyCall])
        ),
      ];
    }

    // if ( Reactive(Inputs) ) { ...evalBody } else { ...memoBody }
    this.code.push(
      t.ifStatement(
        /*test*/ cond,
        /*consequent*/ t.blockStatement(evalBody),
        /*alternate*/ skipBody.length > 0
          ? t.blockStatement(skipBody)
          : undefined
      )
    );
  }

  /**
   * TODO: Currently, all decls are considered as outputs. We'll need a better check.
   */
  genDeclWithOutputsRewritten(instr: LIR.Instr): t.Statement[] {
    invariant(instr.ir.isDecl, "Should only be called on Decl.");

    const res: t.Statement[] = [];

    // Rewrite ClassDeclaration to assignment to ClassExpression.
    if (instr.ast.isClassDeclaration()) {
      const cd = instr.ast.node;
      res.push(
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            cd.id,
            t.classExpression(cd.id, cd.superClass, cd.body, cd.decorators)
          )
        )
      );
    }

    // Rewrite FunctionDeclaration to assignment to FunctionExpression.
    if (instr.ast.isFunctionDeclaration()) {
      const fd = instr.ast.node;
      invariant(fd.id, "Can you have a FD without a name??");

      res.push(
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            fd.id,
            t.functionExpression(
              fd.id,
              fd.params,
              fd.body,
              fd.generator,
              fd.async
            )
          )
        )
      );
    }

    // Rewrite each VariableDeclarators in VariableDeclaration to assignments.
    if (instr.ast.isVariableDeclaration()) {
      // A destructuring declarators can produce multiple bindings, so we need
      // to narrow to a set first.
      const varDeclaratorNodes = new Set<t.VariableDeclarator>();

      for (const def of instr.ir.decls) {
        const vd = def.binding.path;
        invariant(vd.isVariableDeclarator(), "");
        varDeclaratorNodes.add(vd.node);
      }

      for (const vd of varDeclaratorNodes) {
        if (vd.init) {
          res.push(
            t.expressionStatement(t.assignmentExpression("=", vd.id, vd.init))
          );
        }
      }
    }

    return res;
  }

  genRewrittenReturn(
    ret: NodePath<t.ReturnStatement>,
    retIdx: number
  ): t.Statement {
    const returnVal = ret.node.argument
      ? this.memoCache.writeReturnValue(ret.node.argument)
      : t.identifier("undefined");

    if (this.memoCache.hasRetIdx) {
      // $[ret] = <ret arg>
      return t.returnStatement(
        t.sequenceExpression([this.genUpdateReturnIdx(retIdx), returnVal])
      );
    } else {
      return t.returnStatement(returnVal);
    }
  }

  genUpdateReturnIdx(retIdx: number) {
    // $[ret_i] = ret_idx
    return this.memoCache.writeReturnIndex(retIdx);
  }

  genReturnReplay(retIdx: number): t.Statement {
    invariant(retIdx < this.lir.ir.returnCount, "retIdx >= returnCount");
    const returnReplay = t.returnStatement(this.memoCache.readReturnValue());
    if (this.memoCache.hasRetIdx) {
      return t.ifStatement(
        this.memoCache.isMemoizedReturnIndex(retIdx),
        /*cons*/ returnReplay
      );
    } else {
      // Single Return Optimization
      return returnReplay;
    }
  }

  /**
   * Note that it's critical to keep this method a POST-order traveral so that
   * the children of @param expr is rewritten BEFORE it's rewritten. Otherwise,
   * Babel will complain "Container is falsy".
   */
  rewriteExprInJSXTree(expr: IR.ExprVal) {
    if (IR.isJSXTagVal(expr)) {
      expr.children.forEach((child) => this.rewriteExprInJSXTree(child));
    }
    if (!expr.stable) {
      const entry = this.memoCache.entries.get(expr);
      if (entry) {
        invariant(LIR.MemoCache.isExprEntry(entry), "");
        expr.ast.replaceWith(this.genReactiveTenary(entry));
      }
    }
  }

  /**
   * Rewrite expression to a tenary to be reactive.
   * If inputs of @param entry is empty, @returns
   *   ( $.isEmpty(i) ) ? ($[i] = expr) : $[i]
   * Otherwise, @returns
   *   ( Reactions(Inputs) ) ? ($[i] = expr) : $[i]
   */
  genReactiveTenary(entry: LIR.MemoCache.ExprEntry) {
    const { inputs } = this.lir.ir.depGraph.getOrCreateVertex(entry.value);
    const cacheInvalidation =
      inputs.size === 0
        ? this.memoCache.isEmpty(entry)
        : this.genReactions(inputs);

    const rewrittenExpr = t.conditionalExpression(
      cacheInvalidation,
      this.memoCache.write(entry, entry.value.ast.path.node),
      this.memoCache.read(entry)
    );

    // If the expr is originated from the JSX children position, wrap the
    // rewritten expression in an JSXExpressionContainer.
    return entry.value.ast.path.listKey === "children"
      ? t.jsxExpressionContainer(rewrittenExpr)
      : rewrittenExpr;
  }

  /**
   * Helpers that generate code checking the inputs diffing results.
   * @param inputs
   * @returns
   *    c_input1 || c_input2 || ...
   */
  genReactions(inputs: Set<IR.ReactiveVal>): t.Expression {
    const inputIdents: t.Expression[] = [...inputs].map((input) =>
      this.getChangeVar(input.binding.identifier.name)
    );

    return inputIdents.reduce((tree, depIdent) =>
      t.logicalExpression("||", tree, depIdent)
    );
  }

  getChangeVar(varName: string): t.Identifier {
    let changeVarIdentifier = this.changeVarIds.get(varName);
    if (changeVarIdentifier == null) {
      const changeVarName = `c_${varName}`;
      changeVarIdentifier = this.lir.ir.ast.scope.hasBinding(changeVarName)
        ? this.lir.ir.ast.scope.generateUidIdentifier(changeVarName)
        : t.identifier(changeVarName);
      this.changeVarIds.set(varName, changeVarIdentifier);
    }
    return changeVarIdentifier;
  }
}
