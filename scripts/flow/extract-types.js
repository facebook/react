// @noflow

const traverse = require('babel-traverse');
const generate = require('babel-generator');
const {
  parse,
  readSource,
  resolveFileName,
  bundle,
  getDir,
  write,
} = require('./utils');

const MAIN_FILE = resolveFileName(
  './packages/react-reconciler/index.js',
  process.cwd(),
);

const alreadyExtracted = new Map();
let exportedTypes = [];

// completely resolved sourceValue => type declarations
function collectTypes(currentFileName) {
  // sourceValue (source.value)
  // Eg: 'http' 'react-dom/server' './ReactFiberComponent'
  let typeDeclarationNodes = [];

  const ast = parse(readSource(currentFileName));
  traverse.default(ast, {
    ImportDeclaration(path) {
      const {node: {importKind, source}} = path;
      if (importKind === 'type' || importKind === 'typeof') {
        const nextFileName = resolveFileName(
          source.value,
          getDir(currentFileName),
        );

        if (!alreadyExtracted.get(nextFileName)) {
          typeDeclarationNodes = typeDeclarationNodes.concat(
            collectTypes(nextFileName),
          );
        }

        // sourceValues.push({
        //   sourceValue: source.value,
        //   currentFileDir: getDir(currentFileName),
        //   onlyTheseTypes: typesToBeImported,
        // });
      }
    },
    ExportDeclaration(path) {
      const {node: {exportKind, specifiers, source, declaration}} = path;
      if (exportKind === 'type' || exportKind === 'typeof') {
        if (specifiers.length > 0) {
          // Temporarily ignored
          const typesToBeImported = specifiers.map(s => s.exported.name);

          if (currentFileName === MAIN_FILE) {
            exportedTypes = exportedTypes.concat(typesToBeImported);
          }

          const nextFileName = resolveFileName(
            source.value,
            getDir(currentFileName),
          );
          // console.log(nextFileName, alreadyExtracted.get(nextFileName));
          if (!alreadyExtracted.get(nextFileName)) {
            typeDeclarationNodes = typeDeclarationNodes.concat(
              collectTypes(nextFileName),
            );
          }

          // sourceValues.push({
          //   sourceValue: source.value,
          //   currentFileDir: getDir(currentFileName),
          //   onlyTheseTypes: typesToBeImported,
          // });
        } else {
          if (exportedTypes.length) {
            if (exportedTypes.indexOf(declaration.id.name) !== -1) {
              typeDeclarationNodes.push(path.node);
            }
          }
        }
      }
    },
    FlowDeclaration(path) {
      const {node: {type}} = path;
      if (type === 'TypeAlias') {
        if (
          exportedTypes.length &&
          exportedTypes.indexOf(path.node.id.name) !== -1
        ) {
          // This declaration has already been extracted
          return;
        }
        typeDeclarationNodes.push(path.node);
      }
    },
  });
  alreadyExtracted.set(currentFileName, true);
  return typeDeclarationNodes;
}

const topLevelDeclarations = collectTypes(MAIN_FILE);

const typeDeclarationsAST = bundle(topLevelDeclarations);
write(
  './packages/react-reconciler/src/ReactFiberReconcilerTypes.js',
  generate.default(typeDeclarationsAST).code,
);
