# Review: react_compiler_inference/src/build_reactive_scope_terminals_hir.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/BuildReactiveScopeTerminalsHIR.ts`

## Summary
The Rust port correctly implements the building of reactive scope terminals in the HIR. The algorithm matches the TypeScript source with appropriate adaptations for Rust's ownership model.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Scope collection function name
**Location:** `build_reactive_scope_terminals_hir.rs:32` vs TS line 9

**TypeScript:** Uses `getScopes(fn)` imported from `AssertValidBlockNesting` (TS line 9)
**Rust:** Implements inline as `get_scopes(func, env)` (lines 32-63)

**Impact:** Both collect unique non-empty scopes. The Rust version is self-contained rather than imported.

### 2. recursivelyTraverseItems abstraction
**Location:** TS lines 86-96 vs Rust lines 96-176

**TypeScript:**
```typescript
recursivelyTraverseItems(
  [...getScopes(fn)],
  scope => scope.range,
  {
    fallthroughs: new Map(),
    rewrites: queuedRewrites,
    env: fn.env,
  },
  pushStartScopeTerminal,
  pushEndScopeTerminal,
);
```

**Rust:**
```rust
let mut queued_rewrites = collect_scope_rewrites(func, env);
```

**Difference:** TypeScript uses a generic `recursivelyTraverseItems` helper from `AssertValidBlockNesting` that calls `pushStartScopeTerminal` and `pushEndScopeTerminal` callbacks. Rust inlines this logic into `collect_scope_rewrites()`.

**Impact:** Same algorithm, different abstraction. Rust is more explicit.

### 3. Terminal rewrite info structure
**Location:** Rust lines 69-80 vs TS lines 190-202

**TypeScript:**
```typescript
type TerminalRewriteInfo =
  | {
      kind: 'StartScope';
      blockId: BlockId;
      fallthroughId: BlockId;
      instrId: InstructionId;
      scope: ReactiveScope;
    }
  | {
      kind: 'EndScope';
      instrId: InstructionId;
      fallthroughId: BlockId;
    };
```

**Rust:**
```rust
enum TerminalRewriteInfo {
    StartScope {
        block_id: BlockId,
        fallthrough_id: BlockId,
        instr_id: EvaluationOrder,
        scope_id: ScopeId,
    },
    EndScope {
        instr_id: EvaluationOrder,
        fallthrough_id: BlockId,
    },
}
```

**Difference:** Rust uses `ScopeId` instead of `ReactiveScope`, consistent with arena architecture.

### 4. fixScopeAndIdentifierRanges comment
**Location:** Lines 352-364

**Excellent documentation:** The Rust implementation includes a detailed comment explaining the shared mutable_range behavior in TypeScript:

```rust
/// In TS, `identifier.mutableRange` and `scope.range` are the same object
/// reference (after InferReactiveScopeVariables). When scope.range is updated,
/// all identifiers with that scope automatically see the new range.
/// BUT: after MergeOverlappingReactiveScopesHIR, repointed identifiers have
/// mutableRange pointing to the OLD scope's range, NOT the root scope's range.
/// So only identifiers whose mutableRange matches their scope's pre-renumbering
/// range should be updated.
```

This is more detailed than the TypeScript comment and correctly explains the subtle behavior.

## Architectural Differences

### 1. Scope storage
- **TypeScript:** Uses `ReactiveScope` objects directly
- **Rust:** Uses `ScopeId` to reference scopes in the arena

### 2. recursivelyTraverseItems inlined
- **TypeScript:** Uses generic helper from `AssertValidBlockNesting`
- **Rust:** Inlines the pre-order traversal logic into `collect_scope_rewrites()`

### 3. Block ID allocation
- **TypeScript:** `context.env.nextBlockId` (property getter, TS line 218)
- **Rust:** `env.next_block_id()` (method call, Rust line 152)

### 4. fixScopeAndIdentifierRanges
- **TypeScript:** Imported from `HIRBuilder` module (TS line 24)
- **Rust:** Implemented inline (lines 352-405)

Both implementations are identical in logic.

### 5. Phi operand updates
**Location:** Rust lines 323-341 vs TS lines 157-170

**TypeScript:**
```typescript
for (const [originalId, value] of phi.operands) {
  const newId = rewrittenFinalBlocks.get(originalId);
  if (newId != null) {
    phi.operands.delete(originalId);
    phi.operands.set(newId, value);
  }
}
```

**Rust:**
```rust
let updates: Vec<(BlockId, BlockId)> = phi
    .operands
    .keys()
    .filter_map(|original_id| {
        rewritten_final_blocks
            .get(original_id)
            .map(|new_id| (*original_id, *new_id))
    })
    .collect();
for (old_id, new_id) in updates {
    if let Some(value) = phi.operands.shift_remove(&old_id) {
        phi.operands.insert(new_id, value);
    }
}
```

**Difference:** Rust uses two-phase (collect updates, then apply) to avoid mutating while iterating. TypeScript can delete/insert during iteration.

## Missing from Rust Port
None. All logic is present.

## Additional in Rust Port

### 1. Inline scope traversal
The `collect_scope_rewrites()` function (lines 96-176) inlines the logic from TypeScript's `recursivelyTraverseItems`. This is more explicit and easier to follow.

### 2. Helper method on TerminalRewriteInfo
**Location:** Lines 83-89

```rust
impl TerminalRewriteInfo {
    fn instr_id(&self) -> EvaluationOrder {
        match self {
            TerminalRewriteInfo::StartScope { instr_id, .. } => *instr_id,
            TerminalRewriteInfo::EndScope { instr_id, .. } => *instr_id,
        }
    }
}
```

This helper makes the code more ergonomic. TypeScript accesses `rewrite.instrId` directly since both variants have this field.

### 3. Identifier mutable_range sync
**Location:** Lines 393-404

As with other passes, Rust must explicitly sync `identifier.mutable_range` with `scope.range` after mutations.
