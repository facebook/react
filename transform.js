const calls = [
  'warningWithoutStack',
  'warning',
  'lowPriorityWarning',
  'lowPriorityWarningWithoutStack',
];

function simplify(thing) {
  if (!thing) {
    return thing;
  }
  if (thing.type === 'UnaryExpression' && thing.operator === '!') {
    if (
      thing.argument.type === 'UnaryExpression' &&
      thing.argument.operator === '!'
    ) {
      return thing.argument.argument;
    }
    if (thing.argument.type === 'BinaryExpression') {
      let newOperator;
      switch (thing.argument.operator) {
        case '===': {
          newOperator = '!==';
          break;
        }
        case '!==': {
          newOperator = '===';
          break;
        }
        case '==': {
          newOperator = '!=';
          break;
        }
        case '!=': {
          newOperator = '==';
          break;
        }
        case '<=': {
          newOperator = '>';
          break;
        }
        case '<': {
          newOperator = '>=';
          break;
        }
        case '>': {
          newOperator = '<=';
          break;
        }
        case '>=': {
          newOperator = '<';
          break;
        }
        default: {
          throw thing.argument.operator;
        }
      }
      return {...thing.argument, operator: newOperator};
    }
  }
  return thing;
}

module.exports = function(fileInfo, {jscodeshift: j}) {
  return j(fileInfo.source)
    .find('CallExpression')
    .filter(c => calls.includes(c.value.callee.name))
    .replaceWith(c => {
      const newFunction = c.value;
      const conditional = c.value.arguments.shift();

      if (conditional.value === false) {
        return newFunction;
      }

      let returnable = j.unaryExpression('!', conditional);
      if (conditional.type === 'LogicalExpression') {
        switch (conditional.operator) {
          case '||':
            if (conditional.left.type !== 'LogicalExpression') {
              returnable = j.logicalExpression(
                '&&',
                simplify(j.unaryExpression('!', conditional.left)),
                simplify(j.unaryExpression('!', conditional.right))
              );
            }
            break;
          case '&&':
            if (conditional.left.type !== 'LogicalExpression') {
              returnable = j.logicalExpression(
                '||',
                simplify(j.unaryExpression('!', conditional.left)),
                simplify(j.unaryExpression('!', conditional.right))
              );
            }
            break;
        }
      }
      return j.ifStatement(
        simplify(returnable),
        j.blockStatement([j.expressionStatement(newFunction)])
      );
    })
    .toSource();
};
