import { ArrayExpression, Effect, Environment, FunctionExpression, GeneratedSource, HIRFunction, IdentifierId, Instruction, isUseEffectHookType, makeInstructionId } from "../HIR";
import { createTemporaryPlace } from "../HIR/HIRBuilder";

export function inferEffectDependencies(
    env: Environment,
    fn: HIRFunction,
  ): void {
    const fnExpressions = new Map<IdentifierId, FunctionExpression>();
    for (const [, block] of fn.body.blocks) {
      for (const instr of block.instructions) {
        const {value, lvalue} = instr;
        if (
          value.kind === 'FunctionExpression'
        ) {
          fnExpressions.set(lvalue.identifier.id, value)
        }    
      }
    }
    
    for (const [, block] of fn.body.blocks) {
      let newInstructions = [...block.instructions];
      let addedInstrs = 0;
      for (const [idx, instr] of block.instructions.entries()) {
        const {value} = instr;
  
        /*
         * This check is not final. Right now we only look for useEffects without a dependency array.
         * This is likely not how we will ship this feature, but it is good enough for us to make progress
         * on the implementation and test it. 
         */
        if (
          value.kind === 'CallExpression' &&
          isUseEffectHookType(value.callee.identifier) &&
          value.args[0].kind === 'Identifier' &&
          value.args.length === 1
        ) {
          const fnExpr = fnExpressions.get(value.args[0].identifier.id);
          if (fnExpr != null) {
            const deps: ArrayExpression = {
              kind: "ArrayExpression",
              elements: [...fnExpr.loweredFunc.dependencies],
              loc: GeneratedSource
            };
            const depsPlace = createTemporaryPlace(env, GeneratedSource);
            depsPlace.effect = Effect.Read;
            const newInstruction: Instruction = {
              id: makeInstructionId(0),
              loc: GeneratedSource,
              lvalue: depsPlace,
              value: deps,
            };
            newInstructions.splice(idx + addedInstrs, 0, newInstruction);
            addedInstrs++;
            value.args[1] = depsPlace;
          }
        }
      }
      block.instructions = newInstructions;
    }
  }
