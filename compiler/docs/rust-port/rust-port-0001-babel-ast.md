# Rust Port Step 1: Babel AST Crate

## Goal

Create a Rust crate (`compiler/crates/react_compiler_ast`) that precisely models the Babel AST structure, enabling JSON round-tripping: parse JS with Babel in Node.js, serialize to JSON, deserialize into Rust, re-serialize back to JSON, and get an identical result.

This crate is the serialization boundary between the JS toolchain (Babel parser) and the Rust compiler. It must be a faithful 1:1 representation of Babel's AST output — not a simplified or custom IR.

**Current status**: All 1714 compiler test fixtures round-trip successfully (0 failures). Scope tree types and Unknown-variant assertion remain to be implemented (see [Remaining Work](#remaining-work)).

---

## Crate Structure

```
compiler/crates/
  react_compiler_ast/
    Cargo.toml
    src/
      lib.rs              # Re-exports, top-level File/Program types
      statements.rs       # Statement enum and statement node structs
      expressions.rs      # Expression enum and expression node structs
      literals.rs         # Literal node structs (StringLiteral, NumericLiteral, etc.)
      patterns.rs         # PatternLike enum and pattern node structs
      jsx.rs              # JSX node structs and enums
      declarations.rs     # Import/export, TS declaration, and Flow declaration structs
      common.rs           # SourceLocation, Position, Comment, BaseNode, helpers
      operators.rs        # Operator enums (BinaryOperator, UnaryOperator, etc.)
    tests/
      round_trip.rs       # Round-trip test harness
```

TypeScript and Flow annotation types are co-located with the module that uses them — TS/Flow expressions live in `expressions.rs`, TS/Flow declarations live in `declarations.rs`. Class-related types are split between `expressions.rs` (ClassExpression, ClassBody) and `statements.rs` (ClassDeclaration). There is no single `Node` enum; the union types (`Statement`, `Expression`, `PatternLike`) serve as the dispatch enums directly.

### Cargo.toml

```toml
[package]
name = "react_compiler_ast"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[dev-dependencies]
walkdir = "2"
similar = "2"           # for readable diffs in round-trip test
```

No other dependencies. The crate is pure data types + serde.

---

## Core Design Decisions

### 1. Internally tagged via `"type"` field

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

Every Babel node shares common fields (`start`, `end`, `loc`, `leadingComments`, etc.). A `BaseNode` struct is flattened into each node struct:

```rust
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BaseNode {
    #[serde(rename = "type", default, skip_serializing_if = "Option::is_none")]
    pub node_type: Option<String>,
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

The `node_type` field captures the `"type"` string when `BaseNode` is deserialized directly (not through a `#[serde(tag = "type")]` enum, which consumes the field). It defaults to `None` and is skipped when absent, so it doesn't interfere with round-tripping in either context.

Each node struct flattens this:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDeclaration {
    #[serde(flatten)]
    pub base: BaseNode,
    pub id: Option<Identifier>,
    pub params: Vec<PatternLike>,
    pub body: BlockStatement,
    #[serde(default)]
    pub generator: bool,
    #[serde(default, rename = "async")]
    pub is_async: bool,
    // ...
}
```

The `#[serde(flatten)]` + `#[serde(tag = "type")]` combination works correctly — the macro fallback described in the risk section was not needed.

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

**Critical subtlety**: Some fields like `FunctionDeclaration.id` are typed `id?: Identifier | null` and appear as `"id": null` in JSON (present but null), not absent. The round-trip test catches any mismatches here. When Babel serializes `null` for a field, we must also serialize `null` — not omit it. The round-trip test is the source of truth for which fields use which pattern.

A `nullable_value` custom deserializer in `common.rs` handles the case where a field needs to distinguish "absent" from "explicitly null" (deserializing the latter as `Some(Value::Null)`):

```rust
pub fn nullable_value<'de, D>(
    deserializer: D,
) -> Result<Option<Box<serde_json::Value>>, D::Error>
```

### 5. The `extra` field

The `extra` field is an unstructured `Record<string, unknown>` in Babel. Use `serde_json::Value` to round-trip it exactly:

```rust
#[serde(default, skip_serializing_if = "Option::is_none")]
pub extra: Option<serde_json::Value>,
```

### 6. `#[serde(deny_unknown_fields)]` — do NOT use

Babel's AST may include fields we don't model (e.g., from plugins, or parser-specific metadata). To ensure forward compatibility and avoid brittle failures, do **not** use `deny_unknown_fields`. Instead, unknown fields are silently dropped during deserialization. The round-trip test detects any fields we're missing, since they'll be absent in the re-serialized output.

---

## Node Type Coverage

All node types that appear in the compiler's 1714 test fixtures are modeled and round-trip successfully. The types are organized as follows:

### Statements (`statements.rs`, ~25 types)

The `Statement` enum is the top-level dispatch for all statement and declaration nodes. It includes direct statement types and also pulls in declaration variants (import/export, TS, Flow) to avoid a separate `StatementOrDeclaration` wrapper.

**Statement types**: `BlockStatement`, `ReturnStatement`, `IfStatement`, `ForStatement`, `WhileStatement`, `DoWhileStatement`, `ForInStatement`, `ForOfStatement`, `SwitchStatement` (+ `SwitchCase`), `ThrowStatement`, `TryStatement` (+ `CatchClause`), `BreakStatement`, `ContinueStatement`, `LabeledStatement`, `ExpressionStatement`, `EmptyStatement`, `DebuggerStatement`, `WithStatement`, `VariableDeclaration` (+ `VariableDeclarator`), `FunctionDeclaration`, `ClassDeclaration`

**Helper enums**: `ForInit` (VariableDeclaration | Expression), `ForInOfLeft` (VariableDeclaration | PatternLike), `VariableDeclarationKind`

### Declarations (`declarations.rs`, ~20 types)

**Import/export**: `ImportDeclaration`, `ExportNamedDeclaration`, `ExportDefaultDeclaration`, `ExportAllDeclaration`, `ImportSpecifier` enum (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier), `ExportSpecifier` enum (ExportSpecifier | ExportDefaultSpecifier | ExportNamespaceSpecifier), `ImportAttribute`, `ModuleExportName`, `Declaration` enum, `ExportDefaultDecl` enum

**TypeScript declarations (pass-through)**: `TSTypeAliasDeclaration`, `TSInterfaceDeclaration`, `TSEnumDeclaration`, `TSModuleDeclaration`, `TSDeclareFunction`

**Flow declarations (pass-through)**: `TypeAlias`, `OpaqueType`, `InterfaceDeclaration`, `DeclareVariable`, `DeclareFunction`, `DeclareClass`, `DeclareModule`, `DeclareModuleExports`, `DeclareExportDeclaration`, `DeclareExportAllDeclaration`, `DeclareInterface`, `DeclareTypeAlias`, `DeclareOpaqueType`, `EnumDeclaration`

### Expressions (`expressions.rs`, ~35 types)

**Core**: `Identifier`, `CallExpression`, `MemberExpression`, `OptionalCallExpression`, `OptionalMemberExpression`, `BinaryExpression`, `LogicalExpression`, `UnaryExpression`, `UpdateExpression`, `ConditionalExpression`, `AssignmentExpression`, `SequenceExpression`, `ArrowFunctionExpression` (+ `ArrowFunctionBody` enum), `FunctionExpression`, `ObjectExpression` (+ `ObjectExpressionProperty` enum, `ObjectProperty`, `ObjectMethod`), `ArrayExpression`, `NewExpression`, `TemplateLiteral`, `TaggedTemplateExpression`, `AwaitExpression`, `YieldExpression`, `SpreadElement`, `MetaProperty`, `ClassExpression` (+ `ClassBody`), `PrivateName`, `Super`, `Import`, `ThisExpression`, `ParenthesizedExpression`

**TypeScript expressions**: `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression`, `TSTypeAssertion`, `TSInstantiationExpression`

**Flow expressions**: `TypeCastExpression`

TypeScript and Flow type annotation bodies (e.g., `TSTypeAnnotation`, type parameters) use `serde_json::Value` for pass-through round-tripping rather than fully-typed structs. This is sufficient since the compiler doesn't inspect these deeply.

### Literals (`literals.rs`, 7 types)

`StringLiteral`, `NumericLiteral`, `BooleanLiteral`, `NullLiteral`, `BigIntLiteral`, `RegExpLiteral`, `TemplateElement` (+ `TemplateElementValue`)

### Patterns (`patterns.rs`, ~5 types)

`PatternLike` enum: `Identifier`, `ObjectPattern`, `ArrayPattern`, `AssignmentPattern`, `RestElement`, `MemberExpression`

`ObjectPatternProperty` enum: `ObjectProperty` (as `ObjectPatternProp`), `RestElement`

### JSX (`jsx.rs`, ~15 types)

`JSXElement`, `JSXFragment`, `JSXOpeningElement`, `JSXClosingElement`, `JSXOpeningFragment`, `JSXClosingFragment`, `JSXAttribute`, `JSXSpreadAttribute`, `JSXExpressionContainer`, `JSXSpreadChild`, `JSXText`, `JSXEmptyExpression`, `JSXIdentifier`, `JSXMemberExpression`, `JSXNamespacedName`

**Helper enums**: `JSXChild`, `JSXElementName`, `JSXAttributeItem`, `JSXAttributeName`, `JSXAttributeValue`, `JSXExpressionContainerExpr`, `JSXMemberExprObject`

### Operators (`operators.rs`, 5 enums)

`BinaryOperator`, `LogicalOperator`, `UnaryOperator`, `UpdateOperator`, `AssignmentOperator` — all variants mapped to their JS string representations via `#[serde(rename)]`.

### Common types (`common.rs`)

`Position` (line, column, optional index), `SourceLocation` (start, end, optional filename, optional identifierName), `Comment` enum (CommentBlock | CommentLine), `CommentData`, `BaseNode`

### Top-level types (`lib.rs`)

`File`, `Program`, `SourceType`, `InterpreterDirective`

### Unknown catch-all variants

Every enum includes a catch-all `Unknown(serde_json::Value)` variant with `#[serde(untagged)]`. This preserves the raw JSON for unmodeled node types, ensuring round-tripping works even if a new node type appears. Currently all 1714 fixtures round-trip through typed variants — no fixtures rely on `Unknown`.

### Union types as enums

Fields typed as `Expression`, `Statement`, `LVal`, `Pattern`, etc. in Babel are Rust enums with `#[serde(tag = "type")]`. Where fields accept a union of specific types (e.g., `ObjectExpression.properties: Array<ObjectMethod | ObjectProperty | SpreadElement>`), purpose-specific enums are used.

---

## Common Types

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub line: u32,
    pub column: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub index: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    pub start: Position,
    pub end: Position,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
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

Note: `Position.index` and `SourceLocation.filename` are `Option` — Babel doesn't always emit these fields.

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
    #[serde(default)]
    pub errors: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Program {
    #[serde(flatten)]
    pub base: BaseNode,
    pub body: Vec<Statement>,
    #[serde(default)]
    pub directives: Vec<Directive>,
    #[serde(rename = "sourceType")]
    pub source_type: SourceType,
    #[serde(default)]
    pub interpreter: Option<InterpreterDirective>,
    #[serde(rename = "sourceFile", default, skip_serializing_if = "Option::is_none")]
    pub source_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SourceType {
    Module,
    Script,
}
```

`Program.body` uses `Vec<Statement>` directly — declarations (import/export, TS, Flow) are variants of the `Statement` enum.

---

## Scope Types (Separate from AST)

> **Status**: Not yet implemented. This is the main remaining work item.

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

Parses each fixture file with Babel and writes the AST JSON to a temp directory. Takes two arguments: source directory and output directory.

```javascript
import { parse } from '@babel/parser';
// ...
const FIXTURE_DIR = process.argv[2]; // source dir with JS/TS files
const OUTPUT_DIR = process.argv[3];  // output dir for JSON files
```

**Key details**:
- Uses `@babel/parser` directly (not Hermes) with `errorRecovery: true` and `allowReturnOutsideFunction: true`
- Selects plugins based on content: `['flow', 'jsx']` for files containing `@flow`, otherwise `['typescript', 'jsx']`
- Always uses `sourceType: 'module'`
- Matches `**/*.{js,ts,tsx,jsx}` files
- Writes each fixture's AST as a separate `.json` file
- Writes `.parse-error` marker files for fixtures that fail to parse (skipped by the Rust test)

### JSON normalization

Before diffing, both the original and round-tripped JSON are normalized on the Rust side:

1. **Key ordering**: Both JSONs are parsed as `serde_json::Value`, keys are recursively sorted, then compared.
2. **`undefined` vs absent**: `JSON.stringify` omits `undefined` values; serde's `skip_serializing_if = "Option::is_none"` does the same.
3. **Number precision**: Whole-number floats (e.g., `1.0`) are normalized to integers (e.g., `1`) for comparison.

### Rust test: `compiler/crates/react_compiler_ast/tests/round_trip.rs`

The test walks all `.json` files in the fixture directory, deserializes each into `File`, re-serializes, normalizes both sides, and diffs. It reports the first 5 failures with unified diffs (capped at 50 lines per fixture) using the `similar` crate.

The fixture JSON directory is specified via the `FIXTURE_JSON_DIR` environment variable, with a fallback to `tests/fixtures/` alongside the test file.

### Test runner: `compiler/scripts/test-babel-ast.sh`

```bash
#!/bin/bash
set -e
# Usage: bash compiler/scripts/test-babel-ast.sh [fixture-source-dir]
# Defaults to the compiler's own test fixtures.
```

Generates fixture JSONs into a temp dir, runs the Rust round-trip test, and cleans up. Accepts an optional fixture source directory argument.

**Running the test**:

```bash
bash compiler/scripts/test-babel-ast.sh
```

---

## Remaining Work

### Scope tree types (from M4)

Define the `ScopeTree`, `ScopeData`, `BindingData`, and related types described in the [Scope Types](#scope-types-separate-from-ast) section. These are Rust struct definitions in the crate — no serialization test infrastructure yet (that's M5).

### Unknown-variant assertion (from M4)

Add a test mode that walks the deserialized AST and asserts no `Unknown` variants were used. Currently all 1714 fixtures round-trip through typed variants, but there's no automated assertion enforcing this. The test should recursively visit every enum in the tree and flag any `Unknown` hits.

### M5: Scope tree serialization

- Extend the Node.js script (or add a new one) to serialize scope trees from `@babel/traverse`
- Add a round-trip test for scope trees
- Verify scope lookups work: for a subset of fixtures, test that `getBinding(name)` on the Rust `ScopeTree` returns the same result as Babel's `scope.getBinding(name)` (verified by a Node.js script that outputs expected binding resolutions)

---

## Resolved Risks

### `#[serde(flatten)]` + `#[serde(tag = "type")]` interaction

This combination works correctly. No macro fallback was needed. The `BaseNode` is flattened into each node struct, and enums use `#[serde(tag = "type")]` for dispatch. The `BaseNode.node_type` field (renamed from `"type"`) handles the case where `BaseNode` is deserialized outside of a tagged enum context.

### Floating point precision

Resolved via the `normalize_json` function in the round-trip test. Whole-number f64 values are normalized to i64 before comparison (e.g., `1.0` → `1`).

### Fixture parse failures

3 of 1717 fixtures fail to parse with `@babel/parser` and are skipped (marked with `.parse-error` files). This is expected — some fixtures use intentionally invalid syntax.

### Performance

All 1714 fixtures round-trip in ~12 seconds (debug build). Not a concern.

### Field presence ambiguity

Resolved empirically via the round-trip test. Fields that Babel always emits (even as `null`) use `Option<T>` without `skip_serializing_if`. Fields that may be absent use `#[serde(default, skip_serializing_if = "Option::is_none")]`. The test is the source of truth.
