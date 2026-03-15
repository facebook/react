# Rust Port Step 1: Babel AST Crate

## Goal

Create a Rust crate (`compiler/crates/react_compiler_ast`) that precisely models the Babel AST structure, enabling JSON round-tripping: parse JS with Babel in Node.js, serialize to JSON, deserialize into Rust, re-serialize back to JSON, and get an identical result.

This crate is the serialization boundary between the JS toolchain (Babel parser) and the Rust compiler. It must be a faithful 1:1 representation of Babel's AST output — not a simplified or custom IR.

**Current status**: All 1714 compiler test fixtures round-trip successfully (0 failures). Remaining work: remove `Unknown` catch-all variants from enums, define scope info types (normalized `ScopeInfo`/`ScopeData`/`BindingData` with `ScopeId`/`BindingId` arena indices), and implement scope resolution testing (see [Remaining Work](#remaining-work)).

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

### No catch-all / Unknown variants

Enums do **not** have catch-all `Unknown(serde_json::Value)` variants. If a fixture contains a node type that isn't modeled, deserialization fails — this is intentional. It surfaces unsupported node types immediately so the representation can be updated, rather than silently passing data through an opaque blob. (Note: the current code still has `Unknown` variants from the initial build-out — removing them is tracked in [Remaining Work](#remaining-work).)

This is distinct from unknown *fields*, which are silently dropped (see design decision #6 on `deny_unknown_fields`). An unknown field on a known node is harmless — an unknown node type is a gap in the model that should be fixed.

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

The compiler needs scope information (binding resolution, scope chain, import metadata) to lower AST into HIR. This is **not** part of the AST JSON — it's a separate normalized data structure. For Babel, it's produced by running `@babel/traverse` on the parsed AST and serialized as a companion JSON. For other parsers (OXC, SWC), it would be produced by converting their native scope representations.

### Design goals

1. **Normalized/flat**: All data stored in flat `Vec`s indexed by `Copy`-able ID newtypes. No reference cycles, no `Rc`/`Arc`. Scope and binding records reference each other via IDs, not pointers.
2. **Parser-agnostic**: The scope types capture what the compiler needs, not the specifics of any parser's scope API. Any parser that can produce binding resolution and scope chain information can populate these types.
3. **AST types stay clean**: The AST crate's serde types have no scope-related fields. Scope-to-AST linkage is via position-based lookup maps in a separate `ScopeInfo` container.
4. **Sufficient for HIR lowering**: Must support all operations the compiler currently performs via Babel's scope API: `getBinding(name)`, `binding.kind`, `binding.scope`, `binding.path` (declaration node type), scope chain walking, `scope.bindings` iteration, and import source resolution.

### Core ID types

```rust
/// Identifies a scope in the scope table. Copy-able, used as an index.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ScopeId(pub u32);

/// Identifies a binding (variable declaration) in the binding table. Copy-able, used as an index.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BindingId(pub u32);
```

Both are newtype wrappers around `u32` and implement `Copy`. They serve as indices into flat `Vec`s in the `ScopeInfo` container. This pattern matches OXC's `ScopeId`/`SymbolId` and the compiler's own HIR `IdentifierId`.

### Normalized tables

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScopeData {
    pub id: ScopeId,
    pub parent: Option<ScopeId>,
    pub kind: ScopeKind,
    /// Bindings declared directly in this scope, keyed by name.
    /// Maps to BindingId for lookup in the binding table.
    pub bindings: HashMap<String, BindingId>,
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
    pub id: BindingId,
    pub name: String,
    pub kind: BindingKind,
    /// The scope this binding is declared in.
    pub scope: ScopeId,
    /// The type of the declaration AST node (e.g., "FunctionDeclaration",
    /// "VariableDeclarator"). Used by the compiler to distinguish function
    /// declarations from variable declarations during hoisting.
    pub declaration_type: String,
    /// For import bindings: the source module and import details.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub import: Option<ImportBindingData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BindingKind {
    Var,
    Let,
    Const,
    Param,
    /// Import bindings (import declarations).
    Module,
    /// Function declarations (hoisted).
    Hoisted,
    /// Other local bindings (class declarations, etc.).
    Local,
    /// Binding kind not recognized by the serializer.
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBindingData {
    /// The module specifier string (e.g., "react" in `import {useState} from 'react'`).
    pub source: String,
    pub kind: ImportBindingKind,
    /// For named imports: the imported name (e.g., "bar" in `import {bar as baz} from 'foo'`).
    /// None for default and namespace imports.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub imported: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImportBindingKind {
    Default,
    Named,
    Namespace,
}
```

Key differences from Babel's in-memory representation:
- **Bindings are stored in a flat table** indexed by `BindingId`, not nested inside scope objects. Each `ScopeData` stores `HashMap<String, BindingId>` mapping names to binding IDs rather than containing full binding data inline.
- **`declaration_type`** replaces Babel's `binding.path.isFunctionDeclaration()` / `binding.path.isVariableDeclarator()` checks. The compiler uses these to determine hoisting behavior — storing the declaration node type as a string avoids needing to cross-reference back into the AST.
- **`ImportBindingData`** captures import source, kind, and imported name, covering all the import resolution the compiler does via `binding.path.isImportSpecifier()` etc.

### ScopeInfo container

```rust
/// Complete scope information for a program. Stored separately from the AST
/// and linked via position-based lookup maps.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScopeInfo {
    /// All scopes, indexed by ScopeId. scopes[id.0] gives the ScopeData for that scope.
    pub scopes: Vec<ScopeData>,
    /// All bindings, indexed by BindingId. bindings[id.0] gives the BindingData.
    pub bindings: Vec<BindingData>,

    /// Maps an AST node's start offset to the scope it creates.
    /// Populated for scope-creating nodes: Program, FunctionDeclaration,
    /// FunctionExpression, ArrowFunctionExpression, BlockStatement,
    /// ForStatement, ForInStatement, ForOfStatement, SwitchStatement,
    /// CatchClause, ClassDeclaration, ClassExpression.
    pub node_to_scope: HashMap<u32, ScopeId>,

    /// Maps an Identifier AST node's start offset to the binding it resolves to.
    /// Only present for identifiers that resolve to a binding (not globals).
    /// An identifier whose start offset is absent from this map is a global reference.
    pub reference_to_binding: HashMap<u32, BindingId>,

    /// The program-level (module) scope. Always scopes[0].
    pub program_scope: ScopeId,
}
```

**AST-to-scope linkage**: The AST types themselves carry no scope information — they remain pure serde data types for JSON round-tripping. The `ScopeInfo` links to AST nodes via start offsets (`u32`), which are stable across serialization. Start offsets are unique per node in Babel's output, making them reliable keys.

**Resolution algorithm** — equivalent to Babel's `scope.getBinding(name)`:

```rust
impl ScopeInfo {
    /// Look up a binding by name starting from the given scope,
    /// walking up the parent chain. Returns None for globals.
    pub fn get_binding(&self, scope_id: ScopeId, name: &str) -> Option<BindingId> {
        let mut current = Some(scope_id);
        while let Some(id) = current {
            let scope = &self.scopes[id.0 as usize];
            if let Some(&binding_id) = scope.bindings.get(name) {
                return Some(binding_id);
            }
            current = scope.parent;
        }
        None
    }

    /// Look up the binding for an identifier reference by its AST node start offset.
    /// Returns None for globals/unresolved references.
    pub fn resolve_reference(&self, identifier_start: u32) -> Option<&BindingData> {
        self.reference_to_binding
            .get(&identifier_start)
            .map(|id| &self.bindings[id.0 as usize])
    }

    /// Get all bindings declared in a scope (for hoisting iteration).
    pub fn scope_bindings(&self, scope_id: ScopeId) -> impl Iterator<Item = &BindingData> {
        self.scopes[scope_id.0 as usize]
            .bindings
            .values()
            .map(|id| &self.bindings[id.0 as usize])
    }
}
```

**Identity comparison**: Babel uses object identity (`binding1.identifier === binding2.identifier`) to compare bindings. In the normalized form, `BindingId` equality serves this purpose — two references that resolve to the same `BindingId` refer to the same declaration. This is equivalent to OXC's `SymbolId` equality.

**`generateUid`/`rename`**: These are mutating operations in Babel used during HIR lowering. In the Rust port, the scope info is read-only input. Unique name generation moves to the Rust side (the Environment already tracks a counter). Renaming is tracked in Rust's own data structures, same as the existing compiler does with its `HIRBuilder.#bindings` map.

### Conversion from other parsers

The `ScopeInfo` structure is parser-agnostic. Each parser integration produces an `(ast::File, ScopeInfo)` pair. The conversion patterns differ by parser:

**From Babel** (current path): The Node.js side runs `@babel/traverse` on the parsed AST and serializes two JSON blobs: the AST (already implemented) and the `ScopeInfo`. The traversal assigns `ScopeId`s in preorder, assigns `BindingId`s in declaration order, and populates the lookup maps by recording each identifier reference's start offset and resolved binding.

**From OXC**: OXC's `oxc_semantic` crate produces an arena-indexed `ScopeTree` + `SymbolTable` + `ReferenceTable` that maps closely to our structure:

| OXC type | Our type | Conversion |
|----------|----------|------------|
| `oxc_semantic::ScopeId(u32)` | `ScopeId(u32)` | Direct ID remapping |
| `oxc_semantic::SymbolId(u32)` | `BindingId(u32)` | Direct ID remapping |
| `ScopeTree` (parent IDs, flags, bindings) | `Vec<ScopeData>` | Map flags to `ScopeKind`, copy parent chain, convert binding maps from `SymbolId` to `BindingId` |
| `SymbolTable` (name, scope, flags) | `Vec<BindingData>` | Map flags to `BindingKind`, copy name and scope ID |
| `ReferenceTable` (symbol ID per reference) | `reference_to_binding: HashMap<u32, BindingId>` | Map each reference's AST node span start to its resolved `BindingId` |
| AST node `scope_id` fields | `node_to_scope: HashMap<u32, ScopeId>` | Map each scope-creating node's span start to its `ScopeId` |

OXC is the most natural fit — both use arena-indexed flat tables with `Copy`-able ID newtypes. The conversion is essentially remapping IDs, which is O(n) with no structural transformation.

**From SWC**: SWC does not produce a separate scope tree. Instead, its resolver pass annotates each `Ident` node with a `SyntaxContext` (an interned ID encoding hygiene/scope context). Converting to our model requires:

1. Run SWC's resolver pass to populate `SyntaxContext` on all identifiers
2. Traverse the resolved AST, building scope data by tracking `SyntaxContext` values and their nesting
3. For each unique `(name, SyntaxContext)` pair, create a `BindingData` entry
4. For each identifier reference, record its start offset → `BindingId` mapping
5. For each scope-creating node, record its start offset → `ScopeId` mapping

This is more work than the OXC path but straightforward — SWC's `SyntaxContext` uniquely identifies each binding's scope context, which gives us the information we need to reconstruct a scope tree.

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

### Remove Unknown variants from enums

Remove all `#[serde(untagged)] Unknown(serde_json::Value)` variants from every enum (`Statement`, `Expression`, `PatternLike`, `ObjectExpressionProperty`, `ForInit`, `ForInOfLeft`, `ImportSpecifier`, `ExportSpecifier`, `ModuleExportName`, `Declaration`, `ExportDefaultDecl`, `ObjectPatternProperty`, `ArrowFunctionBody`, `JSXChild`, `JSXElementName`, `JSXAttributeItem`, `JSXAttributeName`, `JSXAttributeValue`, `JSXExpressionContainerExpr`, `JSXMemberExprObject`). Deserialization should fail on unrecognized node types. All 1714 fixtures already pass through typed variants, so removing `Unknown` should not cause regressions — but run the round-trip test to confirm.

### Scope info types

Define the `ScopeInfo`, `ScopeData`, `BindingData`, and related types described in the [Scope Types](#scope-types-separate-from-ast) section as Rust structs in the crate. Includes `ScopeId`, `BindingId` newtypes, `ScopeKind`, `BindingKind`, `ImportBindingData`, and the resolution methods on `ScopeInfo`.

### Scope resolution test

Verify that the Rust side resolves identifiers to the same scopes and bindings as Babel. The approach uses identifier renaming as a correctness oracle: both Babel and Rust rename every identifier to encode its scope and binding identity, then the outputs are compared.

#### ID assignment

`ScopeId`s and `BindingId`s are assigned as auto-incrementing indices based on **preorder traversal** of the AST:

- **ScopeId**: Assigned in the order scope-creating nodes are entered during a depth-first AST walk. The program scope is `ScopeId(0)`, the first nested scope is `ScopeId(1)`, etc.
- **BindingId**: Each unique binding declaration is assigned an ID in the order it is first encountered during the same traversal. The first declared binding is `BindingId(0)`, the second is `BindingId(1)`, etc.

These IDs match between the Babel and Rust sides because both use the same deterministic preorder traversal.

#### Renaming scheme

Every `Identifier` node that resolves to a binding is renamed from `<name>` to `<name>_s<scopeId>_b<bindingId>`, where `scopeId` is the scope the identifier appears in (from `node_to_scope` / the enclosing scope), and `bindingId` is the resolved binding's ID (from `reference_to_binding`). For example:

```javascript
// Input:
function foo(x) { let y = x; }

// After renaming (scope 0 = program, scope 1 = function body):
function foo_s0_b0(x_s1_b1) { let y_s1_b2 = x_s1_b1; }
```

Identifiers that don't resolve to any binding (globals, unresolved references) are left unchanged.

#### Implementation

**Babel side** (`compiler/scripts/babel-ast-to-json.mjs` or a new companion script):
1. Parse the fixture with `@babel/parser`
2. Traverse with `@babel/traverse`, collecting scope and binding data
3. Assign `ScopeId`s and `BindingId`s in preorder
4. Build the `ScopeInfo` JSON (scopes table, bindings table, `node_to_scope` map, `reference_to_binding` map)
5. Rename all bound identifiers per the scheme above
6. Write both the `ScopeInfo` JSON and the renamed AST JSON

**Rust side** (`compiler/crates/react_compiler_ast/tests/scope_resolution.rs`):
1. Deserialize the original (un-renamed) AST JSON and the `ScopeInfo` JSON
2. Walk the AST, using `ScopeInfo.reference_to_binding` to resolve each identifier and `ScopeInfo.node_to_scope` to determine enclosing scopes
3. Rename all bound identifiers per the same scheme
4. Re-serialize the renamed AST to JSON
5. Normalize and compare against the Babel-renamed JSON — they must match

This verifies that the `ScopeInfo` structure correctly reproduces Babel's binding resolution. If an identifier is renamed differently (or renamed on one side but not the other), the diff immediately shows which binding or scope diverges.

#### Integration

The scope resolution test is a separate Rust test (`tests/scope_resolution.rs`), not part of `round_trip.rs`. Both tests are run from the same `compiler/scripts/test-babel-ast.sh` script:

```bash
#!/bin/bash
set -e
# ...generate fixture JSONs + scope JSONs into $TMPDIR...

# Test 1: AST round-trip
FIXTURE_JSON_DIR="$TMPDIR" cargo test -p react_compiler_ast --test round_trip -- --nocapture

# Test 2: Scope resolution
FIXTURE_JSON_DIR="$TMPDIR" cargo test -p react_compiler_ast --test scope_resolution -- --nocapture
```

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
