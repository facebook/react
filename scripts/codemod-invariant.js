'use strict';

export const parser = 'flow';

export default function transformer(file, api) {
  const j = api.jscodeshift;

  function evalToStringArray(ast, allArgs) {
    let result;
    switch (ast.type) {
      case 'StringLiteral':
      case 'Literal': {
        const formatString = ast.value;
        const quasis = formatString.split('%s').map(raw => {
          // This isn't a generally correct solution for escaping backticks
          // because it doesn't account for backticks that are already escape
          // but it's is good enough for this codemod since none of our existing
          // invariant messages do that. And the error code lint rule will
          // catch mistakes.
          const stringWithBackticksEscaped = raw.replace(/`/g, '\\`');
          return j.templateElement(
            {
              raw: stringWithBackticksEscaped,
              cooked: stringWithBackticksEscaped,
            },
            false
          );
        });
        const numberOfQuasis = quasis.length;
        if (numberOfQuasis === 1) {
          result = ast;
          break;
        }
        const numberOfArgs = numberOfQuasis - 1;
        const args = allArgs.slice(0, numberOfArgs);
        allArgs.splice(0, numberOfArgs);
        result = j.templateLiteral(quasis, args);
        break;
      }
      case 'BinaryExpression': // `+`
        if (ast.operator !== '+') {
          throw new Error('Unsupported binary operator ' + ast.operator);
        }
        result = j.binaryExpression(
          '+',
          evalToStringArray(ast.left, allArgs),
          evalToStringArray(ast.right, allArgs)
        );
        break;
      default:
        throw new Error('Unsupported type ' + ast.type);
    }

    result.comments = ast.comments;
    return result;
  }

  function invertCondition(cond) {
    let invertedCond;
    let isUnsafeInversion = false;
    if (cond.type === 'UnaryExpression' && cond.operator === '!') {
      invertedCond = cond.argument;
    } else if (cond.type === 'BinaryExpression') {
      switch (cond.operator) {
        case '==': {
          invertedCond = j.binaryExpression('!=', cond.left, cond.right);
          break;
        }
        case '!=': {
          invertedCond = j.binaryExpression('==', cond.left, cond.right);
          break;
        }
        case '===': {
          invertedCond = j.binaryExpression('!==', cond.left, cond.right);
          break;
        }
        case '!==': {
          invertedCond = j.binaryExpression('===', cond.left, cond.right);
          break;
        }
        case '<': {
          invertedCond = j.binaryExpression('>=', cond.left, cond.right);
          isUnsafeInversion = true;
          break;
        }
        case '<=': {
          invertedCond = j.binaryExpression('>', cond.left, cond.right);
          isUnsafeInversion = true;
          break;
        }
        case '>': {
          invertedCond = j.binaryExpression('<=', cond.left, cond.right);
          isUnsafeInversion = true;
          break;
        }
        case '>=': {
          invertedCond = j.binaryExpression('<', cond.left, cond.right);
          isUnsafeInversion = true;
          break;
        }
        default: {
          invertedCond = j.unaryExpression('!', cond);
          break;
        }
      }
    } else if (cond.type === 'LogicalExpression') {
      switch (cond.operator) {
        case '&&': {
          const [invertedLeft, leftInversionIsUnsafe] = invertCondition(
            cond.left
          );
          const [invertedRight, rightInversionIsUnsafe] = invertCondition(
            cond.right
          );
          if (leftInversionIsUnsafe || rightInversionIsUnsafe) {
            isUnsafeInversion = true;
          }
          invertedCond = j.logicalExpression('||', invertedLeft, invertedRight);
          break;
        }
        case '||': {
          const [invertedLeft, leftInversionIsUnsafe] = invertCondition(
            cond.left
          );
          const [invertedRight, rightInversionIsUnsafe] = invertCondition(
            cond.right
          );
          if (leftInversionIsUnsafe || rightInversionIsUnsafe) {
            isUnsafeInversion = true;
          }
          invertedCond = j.logicalExpression('&&', invertedLeft, invertedRight);
          break;
        }
        default: {
          invertedCond = j.unaryExpression('!', cond);
          break;
        }
      }
    } else {
      invertedCond = j.unaryExpression('!', cond);
    }
    invertedCond.comments = cond.comments;
    return [invertedCond, isUnsafeInversion];
  }

  let didTransform = false;
  const transformed = j(file.source)
    .find(j.ExpressionStatement)
    .forEach(path => {
      const invariantCall = path.node.expression;
      if (
        invariantCall.type !== 'CallExpression' ||
        invariantCall.callee.name !== 'invariant'
      ) {
        return;
      }
      didTransform = true;
      const [cond, msgFormatAst, ...args] = invariantCall.arguments;
      const msgFormatStrings = evalToStringArray(msgFormatAst, args);

      const throwStatement = j.throwStatement(
        j.newExpression(j.identifier('Error'), [msgFormatStrings])
      );

      const [invertedCond, isUnsafeInversion] = invertCondition(cond);

      const originalComments = path.node.comments;
      if (cond.type === 'Literal' && cond.value === false) {
        throwStatement.comments = originalComments;
        j(path).replaceWith(throwStatement);
      } else {
        const ifStatement = j.ifStatement(
          invertedCond,
          j.blockStatement([throwStatement])
        );
        if (isUnsafeInversion) {
          ifStatement.comments = [
            ...(originalComments || []),
            j.line(' FIXME: Review this condition before merging '),
            j.line(
              ` Should be equivalent to: ${j(
                j.unaryExpression('!', cond)
              ).toSource()} `
            ),
          ];
        } else {
          ifStatement.comments = originalComments;
        }
        j(path).replaceWith(ifStatement);
      }
    });

  if (didTransform) {
    return transformed.toSource();
  }
  return null;
}
