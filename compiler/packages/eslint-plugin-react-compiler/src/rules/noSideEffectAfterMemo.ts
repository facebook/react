import {Rule} from 'eslint';
import {CallExpression, ExpressionStatement} from 'estree';

export const noSideEffectAfterMemo: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detect side effects after useMemo, which can break memoization safety.',
      recommended: false,
    },
    schema: [],
    messages: {
      sideEffectAfterMemo:
        'Avoid side effects after useMemo; it can break memoization safety.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const memoLines: number[] = [];

    return {
      CallExpression(node: CallExpression) {
        const callee = node.callee;
        const isUseMemo =
          (callee.type === 'Identifier' && callee.name === 'useMemo') ||
          (callee.type === 'MemberExpression' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'useMemo');

        if (isUseMemo && node.loc) {
          memoLines.push(node.loc.end.line);
        }
      },

      ExpressionStatement(node: ExpressionStatement) {
        if (!node.loc) return;

        const currentLine = node.loc.start.line;
        const isAfterMemo = memoLines.some(line => currentLine > line);
        if (!isAfterMemo) return;

        const expr = node.expression;
        const isSideEffect =
          expr.type === 'AssignmentExpression' ||
          expr.type === 'UpdateExpression' ||
          (expr.type === 'CallExpression' &&
            expr.callee.type === 'MemberExpression' &&
            expr.callee.object.type !== 'Identifier' && // likely side effect only if mutating object
            !['console'].includes(expr.callee.object.name)); // skip console.log

        if (isSideEffect) {
          context.report({
            node,
            messageId: 'sideEffectAfterMemo',
          });
        }
      },
    };
  },
};
