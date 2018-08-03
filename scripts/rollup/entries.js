function generateESMEntryPoint(packageName, exports) {
  return [
    `import * as dev from "esm/${packageName}.development.mjs";`,
    `import * as prod from "esm/${packageName}.production.min.mjs";`,
    `\n`,
    ...exports.map(
      name =>
        `export var ${name} =\n` +
        `  process.env.NODE_ENV !== 'production' ? dev.${name} : prod.${name}`
    ),
  ].join('\n');
}

module.exports = {
  generateESMEntryPoint,
};
