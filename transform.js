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

      return j.ifStatement(
        j.unaryExpression('!', conditional),
        j.blockStatement([j.expressionStatement(newFunction)])
      );
    })
    .toSource();
};
