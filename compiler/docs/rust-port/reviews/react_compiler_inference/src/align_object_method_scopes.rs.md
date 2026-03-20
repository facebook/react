# Review: react_compiler_inference/src/align_object_method_scopes.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/AlignObjectMethodScopes.ts`

## Summary
The Rust port accurately implements alignment of object method scopes. The logic matches the TypeScript source with appropriate architectural adaptations for the arena-based design.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Recursion order difference
**Location:** `align_object_method_scopes.rs:135-153` vs TS line 56-67

**Issue:** Rust processes inner functions first (lines 135-153), then calls `find_scopes_to_merge()` (line 155). TypeScript does the same (lines 57-67 recurse, then line 69 calls findScopesToMerge). Order is identical, no issue.

### 2. canonicalize() vs manual remap
**Location:** `align_object_method_scopes.rs:180-186` vs TS line 69

**TypeScript (line 69-82):**
```typescript
const scopeGroupsMap = findScopesToMerge(fn).canonicalize();
/**
 * Step 1: Merge affected scopes to their canonical root.
 */
for (const [scope, root] of scopeGroupsMap) {
  if (scope !== root) {
    root.range.start = makeInstructionId(
      Math.min(scope.range.start, root.range.start),
    );
    root.range.end = makeInstructionId(
      Math.max(scope.range.end, root.range.end),
    );
  }
}
```

**Rust (line 180-197):**
```rust
let mut scope_remap: HashMap<ScopeId, ScopeId> = HashMap::new();
merged_scopes.for_each(|scope_id, root_id| {
    if scope_id != root_id {
        scope_remap.insert(scope_id, root_id);
    }
});

for (_block_id, block) in &func.body.blocks {
    for &instr_id in &block.instructions {
        let lvalue_id = func.instructions[instr_id.0 as usize].lvalue.identifier;

        if let Some(current_scope) = env.identifiers[lvalue_id.0 as usize].scope {
            if let Some(&root) = scope_remap.get(&current_scope) {
                env.identifiers[lvalue_id.0 as usize].scope = Some(root);
            }
        }
    }
}
```

**Difference:** TypeScript uses `.canonicalize()` which returns a `Map<ReactiveScope, ReactiveScope>` of all scope-to-root mappings. Rust builds an equivalent `scope_remap: HashMap<ScopeId, ScopeId>` manually. Both approaches are semantically identical.

## Architectural Differences

### 1. Scope storage
- **TypeScript:** `DisjointSet<ReactiveScope>` with actual scope references
- **Rust:** `DisjointSet<ScopeId>` with indices into `env.scopes` arena

### 2. Identifier iteration
- **TypeScript:** Directly mutates `identifier.scope` via shared reference (line 94)
- **Rust:** Iterates all instructions and mutates via arena index (lines 187-197)

### 3. Range update pattern
- **TypeScript:** Mutates `root.range` in-place during iteration (lines 75-80)
- **Rust:** Two-phase collect/apply pattern (lines 158-176)

### 4. Operand visitor
- **TypeScript:** Uses `eachInstructionValueOperand(value)` from visitors module (line 34)
- **Rust:** Manually extracts operands in `find_scopes_to_merge()` (lines 96-101)

## Missing from Rust Port
None. All logic is present.

## Additional in Rust Port
None. No extra functionality added.
