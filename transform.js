const calls = [
  'warningWithoutStack',
  'warning',
  'lowPriorityWarning',
  'lowPriorityWarningWithoutStack',
];

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
      if (
        conditional.type === 'BinaryExpression'
      ) {
        let newOperator;
        switch (conditional.operator) {
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
            throw conditional.operator;
          }
        }
        returnable = {...conditional, operator: newOperator};
      }
      if (
        conditional.type === 'UnaryExpression' &&
        conditional.operator === '!'
      ) {
        returnable = conditional.argument;
      }

      return j.ifStatement(
        returnable,
        j.blockStatement([j.expressionStatement(newFunction)])
      );
    })
    .toSource();
};
