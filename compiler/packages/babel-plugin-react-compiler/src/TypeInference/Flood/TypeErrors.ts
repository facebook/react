import {CompilerError, SourceLocation} from '../..';
import {ConcreteType, printConcrete, printType, VariableId} from './Types';

export function unsupportedLanguageFeature(
  desc: string,
  loc: SourceLocation,
): never {
  CompilerError.throwInvalidJS({
    reason: `Typedchecker does not currently support language feature: ${desc}`,
    loc,
  });
}

export type UnificationError = {left: ConcreteType; right: ConcreteType};

export function raiseUnificationErrors(
  errs: null | Array<UnificationError>,
  loc: SourceLocation,
) {
  if (errs != null) {
    if (errs.length === 0) {
      CompilerError.invariant(false, {
        reason: 'Should not have array of zero errors',
        loc,
      });
    } else if (errs.length === 1) {
      CompilerError.throwInvalidJS({
        reason: `Unable to unify types because ${printConcrete(errs[0].left)} is incompatible with ${printConcrete(errs[0].right)}`,
        loc,
      });
    } else {
      const messages = errs
        .map(
          ({left, right}) =>
            `\t* ${printConcrete(errs[0].left)} is incompatible with ${printConcrete(errs[0].right)}`,
        )
        .join('\n');
      CompilerError.throwInvalidJS({
        reason: `Unable to unify types because:\n${messages}`,
        loc,
      });
    }
  }
}

export function unresolvableTypeVariable(
  id: VariableId,
  loc: SourceLocation,
): never {
  CompilerError.throwInvalidJS({
    reason: `Unable to resolve free variable ${id} to a concrete type`,
    loc,
  });
}

export function cannotAddVoid(explicit: boolean, loc: SourceLocation): never {
  if (explicit) {
    CompilerError.throwInvalidJS({
      reason: `Undefined is not a valid operand of \`+\``,
      loc,
    });
  } else {
    CompilerError.throwInvalidJS({
      reason: `Value may be undefined, which is not a valid operand of \`+\``,
      loc,
    });
  }
}

export function unsupportedTypeAnnotation(
  desc: string,
  loc: SourceLocation,
): never {
  CompilerError.throwInvalidJS({
    reason: `Typedchecker does not currently support type annotation: ${desc}`,
    loc,
  });
}

export function checkTypeArgumentArity(
  desc: string,
  expected: number,
  actual: number,
  loc: SourceLocation,
) {
  if (expected !== actual) {
    CompilerError.throwInvalidJS({
      reason: `Expected ${desc} to have ${expected} type parameters, got ${actual}`,
      loc,
    });
  }
}
