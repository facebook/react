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
          declaration_type: binding.path.node.type,
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

  traverse(ast, {
    enter(path) {
      ensureScope(path.scope);
    },
    Identifier(path) {
      if (!path.isReferencedIdentifier()) return;
      const binding = path.scope.getBinding(path.node.name);
      if (binding && bindingMap.has(binding)) {
        referenceToBinding[String(path.node.start)] = bindingMap.get(binding);
      }
    },
  });

  // Record declaration identifiers in reference_to_binding
  for (const [binding, bid] of bindingMap) {
    if (binding.identifier && binding.identifier.start != null) {
      referenceToBinding[String(binding.identifier.start)] = bid;
    }
  }

  return {
    scopes,
    bindings,
    node_to_scope: nodeToScope,
    reference_to_binding: referenceToBinding,
    program_scope: 0,
  };
}

function renameIdentifiersInJson(jsonValue, scopeInfo) {
  const scopeStack = [];

  function walk(node) {
    if (node === null || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const element of node) {
        walk(element);
      }
      return;
    }

    // Check if this node opens a new scope
    let pushedScope = false;
    if (node.start != null && String(node.start) in scopeInfo.node_to_scope) {
      scopeStack.push(scopeInfo.node_to_scope[String(node.start)]);
      pushedScope = true;
    }

    // Rename Identifier nodes that have a binding
    if (
      node.type === "Identifier" &&
      node.start != null &&
      String(node.start) in scopeInfo.reference_to_binding &&
      scopeStack.length > 0
    ) {
      const bindingId = scopeInfo.reference_to_binding[String(node.start)];
      const currentScopeId = scopeStack[scopeStack.length - 1];
      node.name = `${node.name}_s${currentScopeId}_b${bindingId}`;
    }

    // Recurse into all properties
    for (const key of Object.keys(node)) {
      walk(node[key]);
    }

    // Pop scope if we pushed one
    if (pushedScope) {
      scopeStack.pop();
    }
  }

  walk(jsonValue);
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

    // Create renamed AST for scope resolution verification
    const renamedAst = JSON.parse(JSON.stringify(ast));
    renameIdentifiersInJson(renamedAst, scopeInfo);
    const renamedOutPath = path.join(OUTPUT_DIR, fixture + ".renamed.json");
    fs.writeFileSync(renamedOutPath, JSON.stringify(renamedAst, null, 2));

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
