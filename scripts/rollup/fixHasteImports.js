const { transform } = require('babel-core');

// This makes sure top-level requires() are bound
// to variable names matching the module names.
// This is necessary to stop FB internal require
// transform from complaining.
function fixImportsTransform(babel) {
  const { types: t } = babel;
  return {
    visitor: {
      Program(path) {
        const topLevelVars = path.node.body.filter(node =>
          node.type === 'VariableDeclaration' &&
          node.declarations.length === 1 &&
          node.declarations[0].init &&
          node.declarations[0].init.type === 'CallExpression' &&
          node.declarations[0].init.callee.name === 'require'
        );
        topLevelVars.forEach(v => {
          let moduleName = v.declarations[0].init.arguments[0].value;
          const slashIndex = moduleName.lastIndexOf('/');
          if (slashIndex !== -1) {
            moduleName = moduleName.slice(slashIndex + 1);
          }
          const name = v.declarations[0].id.name;
          if (moduleName === name) {
            return;
          }
          // Names don't match. This means Rollup
          // already uses this name for another variable
          // in the global scope. Swap them so that declaration
          // matches the module name.
          path.scope.rename(moduleName);
          path.scope.rename(name, moduleName);
        });
      },
    },
  };
}

module.exports = function fixHasteImports() {
  return {
    name: 'fix-haste-imports',
    transformBundle(code) {
      return transform(code, {
        compact: false,
        plugins: [fixImportsTransform],
      });
    },
  };
};
