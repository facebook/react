# Review: react_compiler_lowering/src/hir_builder.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIRBuilder.ts`

## Summary
Helper class/struct for constructing the control-flow graph (CFG) during lowering. Manages block construction, instruction emission, exception handling, and binding resolution. The Rust port differs architecturally from TypeScript due to the arena-based ID system and lack of shared references.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Error messages use panic vs CompilerError.invariant (file:426-439, 455-467, 483-495, 513, 537)
**TypeScript** (HIRBuilder.ts:507-517): Uses `CompilerError.invariant()` for scope mismatches
**Rust**: Uses `panic!()` for scope mismatches

**Impact**: TypeScript's invariant errors get recorded as diagnostics and can be aggregated. Rust panics immediately terminate execution. This should be changed to return `Result<T, CompilerDiagnostic>` or record errors on the environment for consistency with TypeScript's fault-tolerance model.

### 2. Build method returns tuple vs modifying in-place (file:592-637)
**TypeScript** (HIRBuilder.ts:373-406): `build()` returns `HIR` only
**Rust**: `build()` returns `(HIR, Vec<Instruction>, IndexMap<String, BindingId>, IndexMap<BindingId, IdentifierId>)`

**Impact**: Rust must return the instruction table and binding maps because it consumes `self`. TypeScript mutates in place and doesn't need to return these. Both approaches are correct for their respective languages.

## Architectural Differences

### 1. Instruction storage: flat table vs nested arrays (file:68-69, 100-101, 269-288)
**TypeScript**: Each `BasicBlock` directly contains `instructions: Array<Instruction>`
**Rust**: `HirBuilder` maintains `instruction_table: Vec<Instruction>` and `BasicBlock.instructions: Vec<InstructionId>`

Per rust-port-architecture.md section "Instructions and EvaluationOrder", this is the expected Rust pattern - instructions are stored in a flat table and blocks reference them by ID.

### 2. Bindings map: BindingId -> IdentifierId vs t.Identifier -> Identifier (file:93)
**TypeScript** (HIRBuilder.ts:87-89): `#bindings: Map<string, {node: t.Identifier, identifier: Identifier}>`
**Rust**: `bindings: IndexMap<BindingId, IdentifierId>`

Rust uses BindingId (from scope info) as the key instead of Babel's AST node. This aligns with the ID-based architecture in rust-port-architecture.md.

### 3. Context tracking: BindingId vs t.Identifier references (file:89-91)
**TypeScript** (HIRBuilder.ts:114): `#context: Map<t.Identifier, SourceLocation>`
**Rust**: `context: IndexMap<BindingId, Option<SourceLocation>>`

Again, Rust uses BindingId instead of AST node references.

### 4. Name collision tracking via used_names (file:94-96, 716-753)
**TypeScript**: Handles name collisions by calling `scope.rename()` which mutates the Babel AST
**Rust**: Tracks `used_names: IndexMap<String, BindingId>` to detect collisions and generates unique names (`name_0`, `name_1`, etc.)

Rust cannot mutate the parsed AST (it's immutable), so it maintains a separate collision-tracking map.

### 5. Function and component scope tracking (file:106-108, 111-112)
**Rust-specific fields**:
- `function_scope: ScopeId` - the scope of the function being compiled
- `component_scope: ScopeId` - the scope of the outermost component/hook
- `context_identifiers: HashSet<BindingId>` - pre-computed set from `find_context_identifiers()`

TypeScript doesn't need these because Babel's scope API provides this information on-demand. Rust pre-computes and stores it.

### 6. Identifier location index (file:113-114, 186-194)
**Rust**: `identifier_locs: &'a IdentifierLocIndex`
**TypeScript**: No equivalent - location info comes from Babel NodePath

Rust maintains this index (built by `build_identifier_loc_index`) because it doesn't have Babel's NodePath.loc API.

### 7. Scope management methods use closures (file:412-497)
**TypeScript** (HIRBuilder.ts:499-573): Methods like `loop()`, `label()`, `switch()` take a callback and return `T`
**Rust**: Same pattern using `impl FnOnce(&mut Self) -> T`

Both use the same "scoped callback" pattern. Rust's closure syntax differs but the semantics match.

### 8. Exception handler stack (file:99, 401-410)
**TypeScript**: `#exceptionHandlerStack: Array<BlockId>`
**Rust**: `exception_handler_stack: Vec<BlockId>`

Same approach, just Rust naming conventions.

### 9. Block completion methods (file:294-398)
Methods like `terminate()`, `terminate_with_continuation()`, `reserve()`, `complete()`, `enter()`, `enter_reserved()` all match their TypeScript equivalents closely. Rust uses `std::mem::replace()` where TypeScript can simply assign.

### 10. FBT depth tracking (file:104, HIRBuilder.ts:122)
Both versions track `fbtDepth` (TypeScript) / `fbt_depth` (Rust) as a counter. Same semantics.

### 11. Merge methods for child builders (file:244-259)
**Rust-specific**: `merge_used_names()` and `merge_bindings()`

These explicitly merge state from child (inner function) builders back to the parent. TypeScript achieves this automatically via shared Map references - parent and child builders share the same `#bindings` map object. Rust can't share mutable references across builders, so it uses explicit merging.

### 12. Binding resolution with "this" check (file:651-754)
**TypeScript** (HIRBuilder.ts:317-370): Checks for `this` in `resolveBinding()` and records an error
**Rust**: Performs the same check but the error has already been removed from the port (see comment at line 690-699 about reserved words)

Actually, checking the code more carefully, Rust doesn't check for "this" in `resolve_binding()`. Let me verify this in the TS code...

Looking at HIRBuilder.ts:330-341, TS checks for "this" and records an UnsupportedSyntax error. Rust should do the same but doesn't appear to. This may be handled elsewhere in the Rust port.

## Missing from Rust Port

### 1. "this" identifier check in resolve_binding (file:651-754 vs HIRBuilder.ts:330-341)
TypeScript's `resolveBinding()` checks if `node.name === 'this'` and records an error. Rust's `resolve_binding()` doesn't perform this check. This could allow invalid code to pass through.

**Recommendation**: Add check for `name == "this"` in `resolve_binding()` and record error:
```rust
if name == "this" {
    self.env.record_error(CompilerErrorDetail {
        category: ErrorCategory::UnsupportedSyntax,
        reason: "`this` is not supported syntax".to_string(),
        description: Some("React Compiler does not support compiling functions that use `this`".to_string()),
        loc: loc.clone(),
        suggestions: None,
    });
}
```

## Additional in Rust Port

### 1. Explicit scope fields (file:106-108, 111-114)
`function_scope`, `component_scope`, `context_identifiers`, and `identifier_locs` fields don't exist in TypeScript because Babel provides this info on-demand. Rust pre-computes and stores them.

### 2. Merge methods (file:244-259)
`merge_used_names()` and `merge_bindings()` are Rust-specific to handle the lack of shared mutable references.

### 3. Accessor methods for disjoint field access (file:221-232, 234-242)
Methods like `scope_info_and_env_mut()`, `identifier_locs()`, `bindings()`, `used_names()` help work around Rust's borrow checker by providing structured access to specific fields.

### 4. Build returns multiple values (file:592-637)
Returns `(HIR, Vec<Instruction>, IndexMap<String, BindingId>, IndexMap<BindingId, IdentifierId>)` because consuming `self` requires returning all owned data. TypeScript only returns `HIR`.

### 5. Helper functions at module level (file:851-1197)
Functions like `each_terminal_successor()`, `terminal_fallthrough()`, `get_reverse_postordered_blocks()`, etc. are module-level in Rust. In TypeScript (HIRBuilder.ts), equivalent functions like `eachTerminalSuccessor()` are also module-level exports, so this matches.

### 6. Reserved word check (file:12-22, 696-714)
Rust has an explicit `is_reserved_word()` helper and checks it in `resolve_binding()`. TypeScript relies on `makeIdentifierName()` to validate this (HIR.ts). Both approaches catch reserved words, just at different points.

### 7. Declaration location preference (file:738-749)
Rust's `resolve_binding_with_loc()` prefers the binding's declaration location over the reference location. This matches TS behavior where Babel's `binding.identifier` comes from the declaration site.

### 8. FBT error only recorded once (file:662-689)
Rust tracks whether an "fbt" binding has been renamed (e.g., to "fbt_0") and only records the error if the resolved name is still "fbt". This simulates TypeScript's behavior where `scope.rename()` mutates the AST and prevents repeated errors.
