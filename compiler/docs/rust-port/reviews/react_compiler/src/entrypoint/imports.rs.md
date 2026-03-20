# Review: react_compiler/src/entrypoint/imports.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Imports.ts`

## Summary
Complete port of import management and ProgramContext. All core functionality present with intentional architectural adaptations for Rust.

## Major Issues
None.

## Moderate Issues

### 1. Missing Babel scope integration (imports.rs:92-97)
**TypeScript** (Imports.ts:87-102):
```typescript
constructor({program, suppressions, opts, filename, code, hasModuleScopeOptOut}: ProgramContextOptions) {
  this.scope = program.scope;  // <-- Babel scope
  this.opts = opts;
  // ...
}
```

**Rust** (imports.rs:56-78):
```rust
pub fn new(
    opts: PluginOptions,
    filename: Option<String>,
    code: Option<String>,
    suppressions: Vec<SuppressionRange>,
    has_module_scope_opt_out: bool,
) -> Self {
    // No scope parameter
}
```

**Issue**: Rust version doesn't take a `scope` parameter. The TS version uses `program.scope` for `hasBinding`, `hasGlobal`, `hasReference` checks.

**Workaround**: Rust version has `init_from_scope` (lines 92-97) which must be called separately after construction. This is less ergonomic but necessary since Rust doesn't have direct access to Babel's scope system.

## Minor Issues

### 1. WeakSet fallback (imports.rs:81 vs Imports.ts:81)
**TypeScript**: `alreadyCompiled: WeakSet<object> | Set<object> = new (WeakSet ?? Set)();`
**Rust**: `already_compiled: HashSet<u32>`

Rust uses `HashSet<u32>` (tracking start positions) instead of WeakSet/Set of objects. This works but is less precise - two functions at the same position would collide (unlikely in practice).

### 2. Missing assertGlobalBinding (imports.rs vs Imports.ts:186-202)
TypeScript has `assertGlobalBinding` method to check for naming conflicts. Not present in Rust version. This may be needed for import validation.

### 3. Event/log tracking (imports.rs:43-47, 180-190)
Rust has events, debug_logs, and ordered_log as direct fields. TypeScript only has logger callback. This is intentional for Rust's serialization model.

## Architectural Differences

### 1. Scope initialization pattern (imports.rs:92-97)
**Intentional**: Two-phase initialization (construct then `init_from_scope`) instead of passing scope in constructor. Required because Rust doesn't have direct Babel scope access.

**TypeScript** (Imports.ts:108-115):
```typescript
hasReference(name: string): boolean {
  return (
    this.knownReferencedNames.has(name) ||
    this.scope.hasBinding(name) ||
    this.scope.hasGlobal(name) ||
    this.scope.hasReference(name)
  );
}
```

**Rust** (imports.rs:99-102):
```rust
pub fn has_reference(&self, name: &str) -> bool {
    self.known_referenced_names.contains(name)
}
```

Rust version only checks `known_referenced_names`. The scope bindings are pre-populated via `init_from_scope`.

### 2. Import specifier ownership (imports.rs:148-173)
**Rust** clones the `NonLocalImportSpecifier` on return (line 156, 172). **TypeScript** returns spread copy `{...maybeBinding}` (line 166).

Both create new instances to prevent external mutation.

### 3. Position-based already-compiled tracking (imports.rs:81)
**Rust**: `HashSet<u32>` keyed by start position
**TypeScript**: `WeakSet<object>` keyed by node identity

**Intentional**: Rust doesn't have object identity, so uses source position as proxy.

## Missing from Rust Port

### 1. assertGlobalBinding method (Imports.ts:186-202)
```typescript
assertGlobalBinding(name: string, localScope?: BabelScope): Result<void, CompilerError> {
  const scope = localScope ?? this.scope;
  if (!scope.hasReference(name) && !scope.hasBinding(name)) {
    return Ok(undefined);
  }
  const error = new CompilerError();
  error.push({
    category: ErrorCategory.Todo,
    reason: 'Encountered conflicting global in generated program',
    description: `Conflict from local binding ${name}`,
    loc: scope.getBinding(name)?.path.node.loc ?? null,
    suggestions: null,
  });
  return Err(error);
}
```

Not present in Rust. May be needed for validating generated import names don't conflict with existing bindings.

### 2. Babel scope integration
TypeScript has full Babel scope access (`this.scope`). Rust pre-loads bindings via `init_from_scope` but can't dynamically query scope tree.

## Additional in Rust Port

### 1. Event/log storage (imports.rs:43-47, 180-190)
Rust stores events and debug logs directly on ProgramContext. TypeScript delegates to logger callback immediately.

**Purpose**: Enables serialization of all events back to JS shim.

### 2. init_from_scope method (imports.rs:92-97)
Separate initialization step to load scope bindings. TypeScript does this in constructor via `program.scope`.

### 3. ordered_log field (imports.rs:47, 182-189)
Tracks interleaved events and debug entries. Not in TypeScript.
