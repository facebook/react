# Rust Port Step 1: Babel AST Crate

## Goal

Create a Rust crate (`compiler/crates/react_compiler_ast`) that precisely models the Babel AST structure, enabling JSON round-tripping: parse JS with Babel in Node.js, serialize to JSON, deserialize into Rust, re-serialize back to JSON, and get an identical result.

This crate is the serialization boundary between the JS toolchain (Babel parser) and the Rust compiler. It must be a faithful 1:1 representation of Babel's AST output — not a simplified or custom IR.

---

## Crate Structure

```
compiler/crates/
  react_compiler_ast/
    Cargo.toml
    src/
      lib.rs              # Re-exports, top-level File type
      node.rs             # The Node enum (all ~100 relevant variants)
      statements.rs       # Statement node structs
      expressions.rs      # Expression node structs
      literals.rs         # Literal node structs (StringLiteral, NumericLiteral, etc.)
      patterns.rs         # Pattern/LVal node structs
      jsx.rs              # JSX node structs
      typescript.rs       # TypeScript annotation node structs (pass-through)
      flow.rs             # Flow annotation node structs (pass-through)
      declarations.rs     # Declaration node structs (import, export, variable, etc.)
      classes.rs          # Class-related node structs
      common.rs           # SourceLocation, Position, Comment, BaseNode fields
      operators.rs        # Operator enums (BinaryOp, UnaryOp, AssignmentOp, etc.)
      extra.rs            # The `extra` field type (serde_json::Value)
```

### Cargo.toml

```toml
[package]
name = "react_compiler_ast"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

No other dependencies. The crate is pure data types + serde.

---

## Core Design Decisions

### 1. Externally tagged via `"type"` field

Babel AST nodes use a `"type"` field as the discriminant (e.g., `"type": "FunctionDeclaration"`). Serde's default externally-tagged enum format doesn't match this. Use **internally tagged** enums with `#[serde(tag = "type")]`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Statement {
    BlockStatement(BlockStatement),
    ReturnStatement(ReturnStatement),
    IfStatement(IfStatement),
    // ...
}
```

Each variant's struct contains the node-specific fields. The `"type"` field is handled by serde's internal tagging.

### 2. BaseNode fields via flattening

Every Babel node shares common fields (`start`, `end`, `loc`, `leadingComments`, etc.). Rather than repeating them on every struct, define a `BaseNode` and flatten it:

```rust
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BaseNode {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub end: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range: Option<(u32, u32)>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extra: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "leadingComments")]
    pub leading_comments: Option<Vec<Comment>>,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "innerComments")]
    pub inner_comments: Option<Vec<Comment>>,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "trailingComments")]
    pub trailing_comments: Option<Vec<Comment>>,
}
```

Each node struct flattens this:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDeclaration {
    #[serde(flatten)]
    pub base: BaseNode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<Identifier>,
    pub params: Vec<Param>,
    pub body: BlockStatement,
    pub generator: bool,
    #[serde(rename = "async")]
    pub is_async: bool,
    // ...
}
```

**Important caveat**: `#[serde(flatten)]` combined with `#[serde(tag = "type")]` on an enclosing enum can have performance and correctness issues. If this causes problems during implementation, the fallback is to repeat the base fields on each struct directly (via a macro). Test this early.

### 3. Naming conventions

- Rust struct/enum names: PascalCase matching the Babel type name exactly (e.g., `FunctionDeclaration`, `JSXElement`)
- Rust field names: snake_case, with `#[serde(rename = "camelCase")]` for JSON mapping
- Reserved words: `#[serde(rename = "async")]` on field `is_async: bool`, `#[serde(rename = "type")]` handled by internal tagging
- Operator strings: mapped via `#[serde(rename = "+")]` etc. on enum variants

### 4. Optional/nullable field patterns

Babel's TypeScript definitions use several patterns. Map them consistently:

| Babel TypeScript | JSON behavior | Rust type |
|---|---|---|
| `field: T` | Always present | `field: T` |
| `field?: T \| null` | Absent or `null` | `#[serde(default, skip_serializing_if = "Option::is_none")] field: Option<T>` |
| `field: Array<T \| null>` | Array with null holes | `field: Vec<Option<T>>` |
| `field: T \| null` (required but nullable) | Present, may be `null` | `field: Option<T>` (no `skip_serializing_if` — always serialize) |

**Critical subtlety**: Some fields like `FunctionDeclaration.id` are typed `id?: Identifier | null` and appear as `"id": null` in JSON (present but null), not absent. The round-trip test will catch any mismatches here. When Babel serializes `null` for a field, we must also serialize `null` — not omit it. This means for fields that Babel always emits (even as null), use `Option<T>` without `skip_serializing_if`. The round-trip test is the source of truth for which fields use which pattern.

### 5. The `extra` field

The `extra` field is an unstructured `Record<string, unknown>` in Babel. Use `serde_json::Value` to round-trip it exactly:

```rust
#[serde(default, skip_serializing_if = "Option::is_none")]
pub extra: Option<serde_json::Value>,
```

### 6. `#[serde(deny_unknown_fields)]` — do NOT use

Babel's AST may include fields we don't model (e.g., from plugins, or parser-specific metadata). To ensure forward compatibility and avoid brittle failures, do **not** use `deny_unknown_fields`. Instead, unknown fields are silently dropped during deserialization. The round-trip test will detect any fields we're missing, since they'll be absent in the re-serialized output.

---

## Node Type Coverage

### Which nodes to model

Model all node types that can appear in the output of `@babel/parser` with the plugins used by the compiler: `['typescript', 'jsx']` and Hermes with `flow: 'all'`. This is approximately 100-120 node types.

The types fall into categories:

**Statements** (~25 types): `BlockStatement`, `ReturnStatement`, `IfStatement`, `ForStatement`, `WhileStatement`, `DoWhileStatement`, `ForInStatement`, `ForOfStatement`, `SwitchStatement`, `SwitchCase`, `ThrowStatement`, `TryStatement`, `CatchClause`, `BreakStatement`, `ContinueStatement`, `LabeledStatement`, `VariableDeclaration`, `VariableDeclarator`, `ExpressionStatement`, `EmptyStatement`, `DebuggerStatement`, `WithStatement`

**Declarations** (~10 types): `FunctionDeclaration`, `ClassDeclaration`, `ImportDeclaration`, `ExportNamedDeclaration`, `ExportDefaultDeclaration`, `ExportAllDeclaration`, `ImportSpecifier`, `ImportDefaultSpecifier`, `ImportNamespaceSpecifier`, `ExportSpecifier`

**Expressions** (~30 types): `Identifier`, `CallExpression`, `MemberExpression`, `OptionalCallExpression`, `OptionalMemberExpression`, `BinaryExpression`, `LogicalExpression`, `UnaryExpression`, `UpdateExpression`, `ConditionalExpression`, `AssignmentExpression`, `SequenceExpression`, `ArrowFunctionExpression`, `FunctionExpression`, `ObjectExpression`, `ArrayExpression`, `NewExpression`, `TemplateLiteral`, `TaggedTemplateExpression`, `AwaitExpression`, `YieldExpression`, `SpreadElement`, `MetaProperty`, `ClassExpression`, `PrivateName`, `Super`, `Import`, `ThisExpression`, `ParenthesizedExpression`

**Literals** (~7 types): `StringLiteral`, `NumericLiteral`, `BooleanLiteral`, `NullLiteral`, `BigIntLiteral`, `RegExpLiteral`, `TemplateElement`

**Patterns** (~5 types): `ObjectPattern`, `ArrayPattern`, `AssignmentPattern`, `RestElement`, `ObjectProperty`, `ObjectMethod`

**JSX** (~12 types): `JSXElement`, `JSXFragment`, `JSXOpeningElement`, `JSXClosingElement`, `JSXOpeningFragment`, `JSXClosingFragment`, `JSXAttribute`, `JSXSpreadAttribute`, `JSXExpressionContainer`, `JSXSpreadChild`, `JSXText`, `JSXEmptyExpression`, `JSXIdentifier`, `JSXMemberExpression`, `JSXNamespacedName`

**TypeScript annotations** (~30 types, pass-through): These are type annotations that appear in the AST but the compiler largely ignores. Model them structurally for round-tripping: `TSTypeAnnotation`, `TSTypeParameterDeclaration`, `TSTypeParameter`, `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression`, `TSInstantiationExpression`, etc. Can use a catch-all `TSType` enum with `serde_json::Value` for the body if exact modeling is too tedious — but the round-trip test will enforce correctness either way.

**Flow annotations** (~20 types, pass-through): Similar to TS. `TypeAnnotation`, `TypeCastExpression`, `TypeParameterDeclaration`, etc.

**Top-level**: `File`, `Program`, `Directive`, `DirectiveLiteral`

### Union types as enums

Fields typed as `Expression`, `Statement`, `LVal`, `Pattern`, etc. in Babel become Rust enums:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Expression {
    Identifier(Identifier),
    CallExpression(CallExpression),
    MemberExpression(MemberExpression),
    BinaryExpression(BinaryExpression),
    StringLiteral(StringLiteral),
    NumericLiteral(NumericLiteral),
    // ... all expression types
}
```

Where fields accept a union of specific types (e.g., `ObjectExpression.properties: Array<ObjectMethod | ObjectProperty | SpreadElement>`), create purpose-specific enums.

### Operator enums

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BinaryOperator {
    #[serde(rename = "+")]  Add,
    #[serde(rename = "-")]  Sub,
    #[serde(rename = "*")]  Mul,
    #[serde(rename = "/")]  Div,
    #[serde(rename = "%")]  Rem,
    #[serde(rename = "**")] Exp,
    #[serde(rename = "==")] Eq,
    #[serde(rename = "===")] StrictEq,
    #[serde(rename = "!=")] Neq,
    #[serde(rename = "!==")] StrictNeq,
    #[serde(rename = "<")]  Lt,
    #[serde(rename = "<=")] Lte,
    #[serde(rename = ">")]  Gt,
    #[serde(rename = ">=")] Gte,
    #[serde(rename = "<<")] Shl,
    #[serde(rename = ">>")] Shr,
    #[serde(rename = ">>>")] UShr,
    #[serde(rename = "|")]  BitOr,
    #[serde(rename = "^")]  BitXor,
    #[serde(rename = "&")]  BitAnd,
    #[serde(rename = "in")] In,
    #[serde(rename = "instanceof")] Instanceof,
    #[serde(rename = "|>")] Pipeline,
}
```

Similar enums for `UnaryOperator`, `LogicalOperator`, `AssignmentOperator`, `UpdateOperator`.

---

## Common Types

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub line: u32,
    pub column: u32,
    pub index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    pub start: Position,
    pub end: Position,
    pub filename: String,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "identifierName")]
    pub identifier_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Comment {
    CommentBlock(CommentData),
    CommentLine(CommentData),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentData {
    pub value: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub end: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
}
```

---

## Top-Level Types

```rust
/// The root type returned by @babel/parser
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct File {
    #[serde(flatten)]
    pub base: BaseNode,
    pub program: Program,
    #[serde(default)]
    pub comments: Vec<Comment>,
    /// Parser errors (recoverable)
    #[serde(default)]
    pub errors: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Program {
    #[serde(flatten)]
    pub base: BaseNode,
    pub body: Vec<StatementOrDeclaration>,
    #[serde(default)]
    pub directives: Vec<Directive>,
    #[serde(rename = "sourceType")]
    pub source_type: SourceType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub interpreter: Option<InterpreterDirective>,
    #[serde(rename = "sourceFile")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SourceType {
    Module,
    Script,
}
```

---

## Scope Types (Separate from AST)

The compiler needs Babel's scope information. This is **not** part of the AST JSON — it's a separate data structure produced by running `@babel/traverse` on the parsed AST. Model it as a separate type for the JSON interchange:

```rust
/// Scope tree produced by @babel/traverse, serialized separately from the AST.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScopeTree {
    /// All scopes, indexed by ScopeId
    pub scopes: Vec<ScopeData>,
    /// Map from AST node start position to its scope ID.
    /// Used to look up which scope a given AST node belongs to.
    pub node_scopes: HashMap<u32, ScopeId>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ScopeId(pub u32);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScopeData {
    pub id: ScopeId,
    pub parent: Option<ScopeId>,
    pub kind: ScopeKind,
    pub bindings: HashMap<String, BindingData>,
    /// Names that are referenced but not bound in this scope
    pub references: HashSet<String>,
    /// Names that are globals (referenced but not bound anywhere in the scope chain)
    pub globals: HashSet<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScopeKind {
    Program,
    Function,
    Block,
    #[serde(rename = "for")]
    For,
    Class,
    Switch,
    Catch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BindingData {
    pub kind: BindingKind,
    /// The start offset of the binding's declaration Identifier node.
    /// Used for identity comparison (two references to the same binding
    /// resolve to the same declaration node start offset).
    pub identifier_start: u32,
    /// The name of the identifier
    pub identifier_name: String,
    /// For import bindings: the source module and import details
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub import_source: Option<ImportBindingSource>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BindingKind {
    Var,
    Let,
    Const,
    Param,
    Module,
    Hoisted,
    Local,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBindingSource {
    pub source: String,
    pub kind: ImportBindingKind,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImportBindingKind {
    Default,
    Named,
    Namespace,
}
```

The scope tree is a pre-computed flattened representation of Babel's scope chain. The Node.js side traverses the AST with `@babel/traverse`, collects scope info, and serializes this structure. The Rust side can then look up bindings by walking the `parent` chain — equivalent to `scope.getBinding(name)`.

**Identity comparison**: Babel uses object identity (`binding1 === binding2`) to compare bindings. In the serialized form, we use the `identifier_start` offset as a unique identity key — two bindings with the same `identifier_start` are the same declaration.

**`generateUid`/`rename`**: These are mutating operations used during HIR lowering. In the Rust port, the scope tree is read-only input. Unique name generation moves to the Rust side (the Environment already tracks a counter). Renaming is tracked in Rust's own data structures.

---

## Approach to Building the Crate

### Incremental, test-driven

Don't try to define all ~120 node types upfront. Instead:

1. Start with the top-level structure (`File`, `Program`) and a small set of common nodes (`Identifier`, `StringLiteral`, `NumericLiteral`, `FunctionDeclaration`, `BlockStatement`, `ReturnStatement`, `ExpressionStatement`, `VariableDeclaration`, `VariableDeclarator`)
2. Run the round-trip test on fixtures — it will fail on the first fixture that uses an unmodeled node type
3. Add that node type, re-run
4. Repeat until all fixtures pass

This approach means we never write speculative type definitions — every type is validated against real Babel output.

### Handling unknown/unmodeled nodes during development

During the incremental build-out, we need a way to handle node types we haven't modeled yet without panicking. Add a catch-all variant to each enum:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Expression {
    Identifier(Identifier),
    // ... known variants ...

    /// Catch-all for node types not yet modeled.
    /// Stores the raw JSON so round-tripping still works.
    #[serde(untagged)]
    Unknown(serde_json::Value),
}
```

The `Unknown` variant preserves the raw JSON for round-tripping. As we add more types, fixtures that were hitting `Unknown` will start deserializing into proper typed variants. The final goal is zero `Unknown` hits across all fixtures — add a test mode that asserts this.

---

## Round-Trip Test Infrastructure

### Overview

```
                   Node.js                          Rust
                   ──────                          ────
fixture.js ──> @babel/parser ──> JSON ──> serde::from_str ──> serde::to_string ──> JSON
                                  │                                                  │
                                  └──────────────── diff ────────────────────────────┘
```

### Node.js script: `compiler/scripts/babel-ast-to-json.mjs`

Parses each fixture file with Babel and writes the AST JSON to a temp directory.

```javascript
import { parse } from '@babel/parser';
import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

const FIXTURE_DIR = path.resolve(
  'packages/babel-plugin-react-compiler/src/__tests__/fixtures'
);
const OUTPUT_DIR = process.argv[2]; // temp dir passed as argument

// Find all fixture source files
const fixtures = glob.sync('**/*.{js,ts,tsx}', { cwd: FIXTURE_DIR });

for (const fixture of fixtures) {
  const input = fs.readFileSync(path.join(FIXTURE_DIR, fixture), 'utf8');
  const isFlow = input.includes('@flow');
  const isScript = input.includes('@script');

  const plugins = isFlow ? ['flow', 'jsx'] : ['typescript', 'jsx'];
  const sourceType = isScript ? 'script' : 'module';

  try {
    const ast = parse(input, {
      sourceFilename: fixture,
      plugins,
      sourceType,
    });

    // Serialize with deterministic key order (JSON.stringify sorts by insertion)
    const json = JSON.stringify(ast, null, 2);

    const outPath = path.join(OUTPUT_DIR, fixture + '.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
  } catch (e) {
    // Parse errors are expected for some fixtures (e.g., intentionally invalid syntax)
    // Write an error marker so the Rust test can skip them
    const outPath = path.join(OUTPUT_DIR, fixture + '.parse-error');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, e.message);
  }
}
```

**Key details**:
- Uses `@babel/parser` directly (not Hermes) for consistency — Flow fixtures can be tested separately if needed
- Writes each fixture's AST as a separate `.json` file
- Writes `.parse-error` marker files for fixtures that fail to parse (these are skipped by the Rust test)

### JSON normalization

Before diffing, both the original and round-tripped JSON must be normalized to handle legitimate serialization differences:

1. **Key ordering**: `JSON.stringify` output has keys in insertion order. Serde outputs keys in struct field definition order. The diff must be key-order-independent. Solution: parse both JSONs, sort keys recursively, re-serialize.

2. **`undefined` vs absent**: In Babel's JSON output, `undefined` values are omitted by `JSON.stringify`. Serde's `skip_serializing_if = "Option::is_none"` does the same. Should be compatible.

3. **Number precision**: JavaScript and Rust may serialize floating point numbers differently (e.g., `1.0` vs `1`). Normalize numeric values.

The normalization should happen on the Rust side for efficiency (parse both JSONs as `serde_json::Value`, recursively sort, compare).

### Rust test: `compiler/crates/react_compiler_ast/tests/round_trip.rs`

```rust
#[test]
fn round_trip_all_fixtures() {
    // 1. Run the Node.js script to generate JSON fixtures (or read pre-generated ones)
    let json_dir = get_fixture_json_dir();

    let mut failures: Vec<(String, String)> = Vec::new();

    for entry in walkdir::WalkDir::new(&json_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension() == Some("json".as_ref()))
    {
        let fixture_name = entry.path().strip_prefix(&json_dir).unwrap();
        let original_json = std::fs::read_to_string(entry.path()).unwrap();

        // Deserialize into our Rust types
        let ast: react_compiler_ast::File = match serde_json::from_str(&original_json) {
            Ok(ast) => ast,
            Err(e) => {
                failures.push((
                    fixture_name.display().to_string(),
                    format!("Deserialization error: {e}"),
                ));
                continue;
            }
        };

        // Re-serialize back to JSON
        let round_tripped = serde_json::to_string_pretty(&ast).unwrap();

        // Normalize and compare
        let original_normalized = normalize_json(&original_json);
        let round_tripped_normalized = normalize_json(&round_tripped);

        if original_normalized != round_tripped_normalized {
            let diff = compute_diff(&original_normalized, &round_tripped_normalized);
            failures.push((fixture_name.display().to_string(), diff));
        }
    }

    if !failures.is_empty() {
        let mut msg = format!("\n{} fixtures failed round-trip:\n\n", failures.len());
        for (name, diff) in &failures {
            msg.push_str(&format!("--- {name} ---\n{diff}\n\n"));
        }
        panic!("{msg}");
    }
}
```

**Diff output**: Use the `similar` crate for readable unified diffs. Show the fixture name, the line numbers, and colored diff of the JSON. Limit diff output per fixture (e.g., first 50 lines) to avoid overwhelming output when many types are missing.

### Test runner integration

Add a script `compiler/scripts/test-babel-ast.sh`:

```bash
#!/bin/bash
set -e

# Generate fixture JSONs
TMPDIR=$(mktemp -d)
node compiler/scripts/babel-ast-to-json.mjs "$TMPDIR"

# Run Rust round-trip test
FIXTURE_JSON_DIR="$TMPDIR" cargo test -p react_compiler_ast --test round_trip

# Clean up
rm -rf "$TMPDIR"
```

Alternatively, the Rust test can invoke the Node.js script itself via `std::process::Command`, generating JSONs into a temp dir on the fly. This is simpler but makes `cargo test` depend on Node.js being available (which it always is in this repo).

### Dev dependencies for the test

```toml
[dev-dependencies]
walkdir = "2"
similar = "2"           # for readable diffs
```

---

## Milestone Criteria

### M1: Scaffold + first fixture round-trips

- Cargo workspace created at `compiler/crates/`
- `react_compiler_ast` crate with `File`, `Program`, `Directive`, `BaseNode`, `SourceLocation`, `Position`, `Comment`
- Basic expression/statement types: `Identifier`, `StringLiteral`, `NumericLiteral`, `BooleanLiteral`, `NullLiteral`, `ExpressionStatement`, `ReturnStatement`, `BlockStatement`, `VariableDeclaration`, `VariableDeclarator`, `FunctionDeclaration`
- `Unknown` catch-all variant on all enums
- Node.js script generating fixture JSONs
- Rust round-trip test passing for at least 1 simple fixture
- Other fixtures either pass (via `Unknown` catch-all) or produce clean diff output

### M2: Core expression and statement coverage

- All statement types modeled
- All expression types modeled
- All literal types modeled
- All pattern/LVal types modeled
- All operator enums modeled
- Target: ~80% of fixtures round-trip without hitting `Unknown`

### M3: JSX + annotations

- All JSX types modeled
- TypeScript annotation types modeled (enough for round-tripping, not necessarily fully typed — `serde_json::Value` fallback acceptable for deeply nested TS type nodes)
- Flow annotation types modeled (same strategy)
- Target: ~95% of fixtures round-trip without `Unknown`

### M4: Full coverage + zero unknowns

- All fixtures round-trip exactly (0 failures, 0 `Unknown` hits)
- Scope tree types defined (serialization tested separately — see below)
- Test mode that asserts no `Unknown` variants were deserialized (walk the tree and check)

### M5: Scope tree serialization

- Node.js script extended to also serialize scope trees
- Round-trip test for scope trees
- Verify scope lookups work: for a subset of fixtures, test that `getBinding(name)` on the Rust `ScopeTree` returns the same result as Babel's `scope.getBinding(name)` (verified by a Node.js script that outputs expected binding resolutions)

---

## Risks and Mitigations

### `#[serde(flatten)]` + `#[serde(tag = "type")]` interaction

Serde's `flatten` with internally tagged enums can cause issues (serde collects all fields into a map, which may reorder or lose type information). **Mitigation**: Test this combination early in M1. If it doesn't work, use a proc macro or `macro_rules!` to stamp out the common BaseNode fields on every struct:

```rust
macro_rules! ast_node {
    (
        $(#[$meta:meta])*
        pub struct $name:ident {
            $($field:tt)*
        }
    ) => {
        $(#[$meta])*
        pub struct $name {
            #[serde(default, skip_serializing_if = "Option::is_none")]
            pub start: Option<u32>,
            #[serde(default, skip_serializing_if = "Option::is_none")]
            pub end: Option<u32>,
            #[serde(default, skip_serializing_if = "Option::is_none")]
            pub loc: Option<SourceLocation>,
            // ... other BaseNode fields ...
            $($field)*
        }
    };
}
```

### Floating point precision

JavaScript's `JSON.stringify(1.0)` produces `"1"`, but Rust's serde_json produces `"1.0"`. **Mitigation**: The JSON normalization step should normalize number representations. Alternatively, use `serde_json`'s `arbitrary_precision` feature or a custom serializer for numeric values.

### Fixture parse failures

Some fixtures may use syntax that `@babel/parser` can't handle (e.g., Flow-specific syntax without the Flow plugin). **Mitigation**: The Node.js script writes `.parse-error` markers, and the Rust test skips those. Track the count of skipped fixtures and aim to minimize it (potentially by also testing with Hermes parser for Flow fixtures).

### Performance

~1700 fixtures is not many — even without parallelism, round-tripping all of them should complete in seconds. Not a concern for this milestone.

### Field presence ambiguity

Some Babel fields are sometimes present as `null` and sometimes absent entirely, depending on the parser path. For example, `FunctionDeclaration.id` is `null` for `export default function() {}` but absent in some edge cases. **Mitigation**: The round-trip test is the source of truth. Start with `skip_serializing_if = "Option::is_none"` (omit when None), and if a fixture fails because Babel emits an explicit `null`, change that field to always serialize. This is exactly the kind of issue the test infrastructure is designed to catch.
