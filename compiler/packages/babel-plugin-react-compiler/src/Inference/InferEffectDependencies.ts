import {
  ArrayExpression,
  Effect,
  Environment,
  FunctionExpression,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  isUseEffectHookType,
  makeInstructionId,
} from '../HIR';
import {createTemporaryPlace} from '../HIR/HIRBuilder';

/**
 * Infers reactive dependencies captured by useEffect lambdas and adds them as
 * a second argument to the useEffect call if no dependency array is provided.
 */
export function inferEffectDependencies(
  env: Environment,
  fn: HIRFunction,
): void {
  const fnExpressions = new Map<IdentifierId, FunctionExpression>();

  for (const [, block] of fn.body.blocks) {
    let rewriteInstrs = new Map();
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      if (value.kind === 'FunctionExpression') {
        fnExpressions.set(lvalue.identifier.id, value);
      } else if (
      /*
       * This check is not final. Right now we only look for useEffects without a dependency array.
       * This is likely not how we will ship this feature, but it is good enough for us to make progress
       * on the implementation and test it.
       */
        value.kind === 'CallExpression' &&
        isUseEffectHookType(value.callee.identifier) &&
        value.args.length === 1 &&
        value.args[0].kind === 'Identifier'
      ) {
        const fnExpr = fnExpressions.get(value.args[0].identifier.id);
        if (fnExpr != null) {
          const deps: ArrayExpression = {
            kind: 'ArrayExpression',
            elements: fnExpr.loweredFunc.dependencies.filter(place => place.reactive),
            loc: GeneratedSource,
          };

          const depsPlace = createTemporaryPlace(env, GeneratedSource);
          depsPlace.effect = Effect.Read;
          value.args[1] = depsPlace;

          const newInstruction: Instruction = {
            id: makeInstructionId(0),
            loc: GeneratedSource,
            lvalue: depsPlace,
            value: deps,
          };
          rewriteInstrs.set(instr.id, newInstruction);
        }
      }
    }
    if (rewriteInstrs.size > 0) {
      const newInstrs = [];
      for (const instr of block.instructions) {
        const newInstr = rewriteInstrs.get(instr.id);
        if (newInstr != null) {
          newInstrs.push(newInstr, instr);
        } else {
          newInstrs.push(instr);
        }
      }
      block.instructions = newInstrs;
    }
  }
}
