import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "fs";
import path from "path";
import fg from "fast-glob";
const { globSync } = fg;

const FIXTURE_DIR = process.argv[2]; // source dir with JS/TS files
const OUTPUT_DIR = process.argv[3]; // output dir for JSON files

if (!FIXTURE_DIR || !OUTPUT_DIR) {
  console.error(
    "Usage: node babel-ast-to-json.mjs <fixtures-dir> <output-dir>"
  );
  process.exit(1);
}

// Find all fixture source files
const fixtures = globSync("**/*.{js,ts,tsx,jsx}", { cwd: FIXTURE_DIR });

function getScopeKind(babelScope) {
  const blockType = babelScope.block.type;
  switch (blockType) {
    case "Program":
      return "program";
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ObjectMethod":
    case "ClassMethod":
    case "ClassPrivateMethod":
      return "function";
    case "BlockStatement":
      return "block";
    case "ForStatement":
    case "ForInStatement":
    case "ForOfStatement":
      return "for";
    case "ClassDeclaration":
    case "ClassExpression":
      return "class";
    case "SwitchStatement":
      return "switch";
    case "CatchClause":
      return "catch";
    default:
      return "block";
  }
}

function getBindingKind(babelKind) {
  switch (babelKind) {
    case "var":
      return "var";
    case "let":
      return "let";
    case "const":
      return "const";
    case "param":
      return "param";
    case "module":
      return "module";
    case "hoisted":
      return "hoisted";
    case "local":
      return "local";
    default:
      return "unknown";
  }
}

function getImportData(binding) {
  if (binding.path.isImportSpecifier()) {
    const imported = binding.path.node.imported;
    return {
      source: binding.path.parent.source.value,
      kind: "named",
      imported: imported.type === "StringLiteral" ? imported.value : imported.name,
    };
  } else if (binding.path.isImportDefaultSpecifier()) {
    return {
      source: binding.path.parent.source.value,
      kind: "default",
    };
  } else if (binding.path.isImportNamespaceSpecifier()) {
    return {
      source: binding.path.parent.source.value,
      kind: "namespace",
    };
  }
  return null;
}

function collectScopeInfo(ast) {
  const scopeMap = new Map(); // Babel scope -> ScopeId
  const bindingMap = new Map(); // Babel binding -> BindingId
  const scopes = [];
  const bindings = [];
  const nodeToScope = {};
  const referenceToBinding = {};
  let nextScopeId = 0;
  let nextBindingId = 0;

  function ensureScope(babelScope) {
    if (scopeMap.has(babelScope)) return scopeMap.get(babelScope);

    // Ensure parent is registered first (preorder: parent gets lower ID)
    if (babelScope.parent) {
      ensureScope(babelScope.parent);
    }

    const id = nextScopeId++;
    scopeMap.set(babelScope, id);

    const parentId = babelScope.parent ? scopeMap.get(babelScope.parent) : null;
    const kind = getScopeKind(babelScope);
    const bindingsMap = {};

    // Register all bindings in this scope
    for (const [name, binding] of Object.entries(babelScope.bindings)) {
      if (!bindingMap.has(binding)) {
        const bid = nextBindingId++;
        bindingMap.set(binding, bid);
        const bindingData = {
          id: bid,
          name,
          kind: getBindingKind(binding.kind),
          scope: id,
          declarationType: binding.path.node.type,
        };

        // Import bindings
        if (binding.kind === "module") {
          bindingData.import = getImportData(binding);
        }

        bindings.push(bindingData);
      }
      bindingsMap[name] = bindingMap.get(binding);
    }

    scopes.push({
      id,
      parent: parentId,
      kind,
      bindings: bindingsMap,
    });

    // Record node_to_scope
    const blockNode = babelScope.block;
    if (blockNode.start != null) {
      nodeToScope[String(blockNode.start)] = id;
    }

    return id;
  }

  // Track context identifiers: variables that are shared between a function
  // and its nested closures via mutation.
  // identifierInfo maps Babel binding -> { reassigned, reassignedByInnerFn, referencedByInnerFn }
  const identifierInfo = new Map();
  const functionStack = []; // stack of function NodePaths for tracking nesting

  const withFunctionScope = {
    enter(path) {
      functionStack.push(path);
    },
    exit() {
      functionStack.pop();
    },
  };

  traverse(ast, {
    enter(path) {
      ensureScope(path.scope);
    },
    FunctionDeclaration: withFunctionScope,
    FunctionExpression: withFunctionScope,
    ArrowFunctionExpression: withFunctionScope,
    ObjectMethod: withFunctionScope,
    Identifier(path) {
      if (!path.isReferencedIdentifier()) return;
      const binding = path.scope.getBinding(path.node.name);
      if (binding && bindingMap.has(binding)) {
        referenceToBinding[String(path.node.start)] = bindingMap.get(binding);

        // Track referencedByInnerFn
        const currentFn = functionStack.at(-1) ?? null;
        if (currentFn != null) {
          const bindingAboveLambda = currentFn.scope.parent.getBinding(path.node.name);
          if (binding === bindingAboveLambda) {
            let info = identifierInfo.get(binding);
            if (!info) {
              info = { reassigned: false, reassignedByInnerFn: false, referencedByInnerFn: false };
              identifierInfo.set(binding, info);
            }
            info.referencedByInnerFn = true;
          }
        }
      }
    },
    AssignmentExpression(path) {
      const left = path.get("left");
      if (left.isLVal()) {
        handleAssignmentForContext(left, functionStack, identifierInfo);
      }
    },
    UpdateExpression(path) {
      const argument = path.get("argument");
      if (argument.isLVal()) {
        handleAssignmentForContext(argument, functionStack, identifierInfo);
      }
    },
  });

  function handleAssignmentForContext(lvalPath, fnStack, infoMap) {
    const node = lvalPath.node;
    if (!node) return;
    switch (node.type) {
      case "Identifier": {
        const name = node.name;
        const binding = lvalPath.scope.getBinding(name);
        if (!binding || !bindingMap.has(binding)) break;
        let info = infoMap.get(binding);
        if (!info) {
          info = { reassigned: false, reassignedByInnerFn: false, referencedByInnerFn: false };
          infoMap.set(binding, info);
        }
        info.reassigned = true;
        const currentFn = fnStack.at(-1) ?? null;
        if (currentFn != null) {
          const bindingAboveLambda = currentFn.scope.parent.getBinding(name);
          if (binding === bindingAboveLambda) {
            info.reassignedByInnerFn = true;
          }
        }
        break;
      }
      case "ArrayPattern": {
        for (const element of lvalPath.get("elements")) {
          if (element.node) handleAssignmentForContext(element, fnStack, infoMap);
        }
        break;
      }
      case "ObjectPattern": {
        for (const property of lvalPath.get("properties")) {
          if (property.isObjectProperty()) {
            handleAssignmentForContext(property.get("value"), fnStack, infoMap);
          } else if (property.isRestElement()) {
            handleAssignmentForContext(property, fnStack, infoMap);
          }
        }
        break;
      }
      case "AssignmentPattern": {
        handleAssignmentForContext(lvalPath.get("left"), fnStack, infoMap);
        break;
      }
      case "RestElement": {
        handleAssignmentForContext(lvalPath.get("argument"), fnStack, infoMap);
        break;
      }
      default:
        break;
    }
  }

  // Compute contextIdentifiers: binding IDs of context variables
  const contextIdentifiers = [];
  for (const [binding, info] of identifierInfo) {
    if (info.reassignedByInnerFn || (info.reassigned && info.referencedByInnerFn)) {
      if (bindingMap.has(binding)) {
        contextIdentifiers.push(bindingMap.get(binding));
      }
    }
  }

  // Record declaration identifiers in reference_to_binding
  for (const [binding, bid] of bindingMap) {
    if (binding.identifier && binding.identifier.start != null) {
      referenceToBinding[String(binding.identifier.start)] = bid;
    }
  }

  return {
    scopes,
    bindings,
    nodeToScope,
    referenceToBinding,
    contextIdentifiers,
    programScope: 0,
  };
}

function renameIdentifiers(ast, scopeInfo) {
  traverse(ast, {
    Identifier(path) {
      const start = path.node.start;
      if (start != null && String(start) in scopeInfo.referenceToBinding) {
        const bindingId = scopeInfo.referenceToBinding[String(start)];
        const binding = scopeInfo.bindings[bindingId];
        path.node.name = `${path.node.name}_${binding.scope}_${bindingId}`;
      }
    },
  });
}

let parsed = 0;
let errors = 0;

for (const fixture of fixtures) {
  const input = fs.readFileSync(path.join(FIXTURE_DIR, fixture), "utf8");
  const isFlow = input.includes("@flow");

  const plugins = isFlow ? ["flow", "jsx"] : ["typescript", "jsx"];
  // Default to module unless there's an indicator it should be script
  const sourceType = "module";

  try {
    const ast = parse(input, {
      sourceFilename: fixture,
      plugins,
      sourceType,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
    });

    const json = JSON.stringify(ast, null, 2);

    const outPath = path.join(OUTPUT_DIR, fixture + ".json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);

    // Collect and write scope info
    const scopeInfo = collectScopeInfo(ast);
    const scopeOutPath = path.join(OUTPUT_DIR, fixture + ".scope.json");
    fs.writeFileSync(scopeOutPath, JSON.stringify(scopeInfo, null, 2));

    // Create renamed AST for scope resolution verification.
    // Traverse the live Babel AST (already serialized above) using
    // @babel/traverse so that identifier resolution matches what you'd
    // get from a standard Babel visitor with NodePath.
    renameIdentifiers(ast, scopeInfo);
    const renamedOutPath = path.join(OUTPUT_DIR, fixture + ".renamed.json");
    fs.writeFileSync(renamedOutPath, JSON.stringify(ast, null, 2));

    parsed++;
  } catch (e) {
    // Parse errors are expected for some fixtures
    const outPath = path.join(OUTPUT_DIR, fixture + ".parse-error");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, e.message);
    errors++;
  }
}

console.log(
  `Parsed ${parsed} fixtures, ${errors} parse errors, ${fixtures.length} total`
);
