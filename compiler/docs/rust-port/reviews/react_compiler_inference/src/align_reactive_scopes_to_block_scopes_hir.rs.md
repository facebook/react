# Review: react_compiler_inference/src/align_reactive_scopes_to_block_scopes_hir.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/AlignReactiveScopesToBlockScopesHIR.ts`

## Summary
The Rust port correctly implements reactive scope alignment to block scopes. The core traversal logic matches the TypeScript source. The main difference is the omission of the `children` field from `ValueBlockNode` which was only used for debug output in TypeScript.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. ValueBlockNode simplified structure
**Location:** `align_reactive_scopes_to_block_scopes_hir.rs:74-76` vs TS lines 286-291

**TypeScript:**
```typescript
type ValueBlockNode = {
  kind: 'node';
  id: InstructionId;
  valueRange: MutableRange;
  children: Array<ValueBlockNode | ReactiveScopeNode>;
};
```

**Rust:**
```rust
#[derive(Clone)]
struct ValueBlockNode {
    value_range: MutableRange,
}
```

**Difference:** Rust omits `kind`, `id`, and `children` fields. The comment on line 72 explains: "The `children` field from the TS implementation is only used for debug output and is omitted here." The `kind` and `id` fields are also only used for the debug `_debug()` and `_printNode()` functions (TS lines 298-321) which are not ported.

**Impact:** No behavioral difference. The debug functions in TS are never called in the main compiler pipeline.

### 2. placeScopes Map not collected
**Location:** Missing from Rust implementation vs TS line 78

**TypeScript (line 78):**
```typescript
const placeScopes = new Map<Place, ReactiveScope>();
```

**TypeScript (lines 85-87):**
```typescript
if (place.identifier.scope !== null) {
  placeScopes.set(place, place.identifier.scope);
}
```

**Rust:** Does not collect this map.

**Impact:** The `placeScopes` map in TypeScript is collected but never read. It appears to be dead code. The Rust port correctly omits it.

### 3. recordPlace() signature difference
**Location:** `align_reactive_scopes_to_block_scopes_hir.rs:702-737` vs TS lines 80-108

**TypeScript:**
```typescript
function recordPlace(
  id: InstructionId,
  place: Place,
  node: ValueBlockNode | null,
): void
```

**Rust:**
```rust
fn record_place_id(
    id: EvaluationOrder,
    identifier_id: IdentifierId,
    node: &Option<ValueBlockNode>,
    env: &mut Environment,
    active_scopes: &mut HashSet<ScopeId>,
    seen: &mut HashSet<ScopeId>,
)
```

**Difference:**
- Rust takes `identifier_id` instead of `Place` (architectural: Place contains IdentifierId, we pass the ID directly)
- Rust takes explicit parameters for `env`, `active_scopes`, and `seen` instead of capturing them from closure scope
- Rust uses `&Option<ValueBlockNode>` instead of `ValueBlockNode | null`

**Impact:** Semantically identical, just different calling conventions due to Rust's explicit borrowing.

### 4. Identifier mutable_range sync added
**Location:** `align_reactive_scopes_to_block_scopes_hir.rs:686-697`

**TypeScript:** Not present (not needed due to shared object references)

**Rust:**
```rust
// Sync identifier mutable_range with their scope's range.
// In TS, identifier.mutableRange and scope.range are the same shared object,
// so modifications to scope.range are automatically visible through the
// identifier. In Rust they are separate copies, so we must explicitly sync.
for ident in &mut env.identifiers {
    if let Some(scope_id) = ident.scope {
        let scope_range = &env.scopes[scope_id.0 as usize].range;
        ident.mutable_range.start = scope_range.start;
        ident.mutable_range.end = scope_range.end;
    }
}
```

**Impact:** This is a necessary architectural difference. In TypeScript, `identifier.mutableRange` shares the same object reference as `scope.range`. In Rust, they are separate, so we must explicitly copy the updated scope range back to identifiers.

## Architectural Differences

### 1. Place vs IdentifierId
- **TypeScript:** Passes `Place` objects containing the identifier
- **Rust:** Passes `IdentifierId` directly, extracts from `Place` at call sites

### 2. Closure captures vs explicit parameters
- **TypeScript:** `recordPlace()` captures `activeScopes`, `seen`, etc. from outer scope
- **Rust:** `record_place_id()` takes explicit mutable references to these structures

### 3. Shared mutable_range object
- **TypeScript:** `identifier.mutableRange` and `scope.range` are the same object reference. Mutating scope.range automatically updates all identifiers
- **Rust:** Separate storage requires explicit sync at end (lines 686-697)

### 4. ValueBlockNode children
- **TypeScript:** Tracks tree structure for debug output
- **Rust:** Omits debug-only fields

## Missing from Rust Port

### 1. Debug output functions
**Location:** TS lines 298-321

The `_debug()` and `_printNode()` functions are not ported. These are debug-only utilities never called in production.

## Additional in Rust Port

### 1. Identifier mutable_range sync
**Location:** Lines 686-697

This is necessary to maintain the invariant that `identifier.mutable_range` matches its `scope.range` after scope mutations. In TypeScript this happens automatically via shared references.

### 2. Helper functions duplicated
**Location:** Lines 204-262, 268-451, 454-462

The Rust implementation includes several helper functions (`each_instruction_lvalue_ids`, `each_pattern_identifier_ids`, `each_instruction_value_operand_ids`, `each_terminal_operand_ids`) that are defined inline rather than imported from a visitors module. This is a reasonable choice to avoid cross-crate dependencies or module organization differences.
