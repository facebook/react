# Review: react_compiler_inference/src/flatten_reactive_loops_hir.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/FlattenReactiveLoopsHIR.ts`

## Summary
The Rust port correctly implements the flattening of reactive scopes inside loops. The logic is simple and matches the TypeScript source exactly.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Loop terminal variants
**Location:** Rust lines 31-38 vs TS lines 24-29

**TypeScript:**
```typescript
switch (terminal.kind) {
  case 'do-while':
  case 'for':
  case 'for-in':
  case 'for-of':
  case 'while': {
    activeLoops.push(terminal.fallthrough);
    break;
  }
```

**Rust:**
```rust
match terminal {
    Terminal::DoWhile { fallthrough, .. }
    | Terminal::For { fallthrough, .. }
    | Terminal::ForIn { fallthrough, .. }
    | Terminal::ForOf { fallthrough, .. }
    | Terminal::While { fallthrough, .. } => {
        active_loops.push(*fallthrough);
    }
```

**Impact:** Identical logic. Rust uses `match` with pattern matching instead of `switch`.

### 2. Scope to PrunedScope conversion
**Location:** Rust lines 39-57 vs TS lines 32-42

**TypeScript:**
```typescript
case 'scope': {
  if (activeLoops.length !== 0) {
    block.terminal = {
      kind: 'pruned-scope',
      block: terminal.block,
      fallthrough: terminal.fallthrough,
      id: terminal.id,
      loc: terminal.loc,
      scope: terminal.scope,
    } as PrunedScopeTerminal;
  }
  break;
}
```

**Rust:**
```rust
Terminal::Scope {
    block,
    fallthrough,
    scope,
    id,
    loc,
} => {
    if !active_loops.is_empty() {
        let new_terminal = Terminal::PrunedScope {
            block: *block,
            fallthrough: *fallthrough,
            scope: *scope,
            id: *id,
            loc: *loc,
        };
        // We need to drop the borrow and reborrow mutably
        let block_mut = func.body.blocks.get_mut(&block_id).unwrap();
        block_mut.terminal = new_terminal;
    }
}
```

**Difference:** Rust needs to destructure the terminal, build the new terminal, then drop the immutable borrow before mutably borrowing the block to update its terminal. TypeScript can mutate in place.

**Impact:** Same behavior, different mutation pattern due to Rust's borrow checker.

### 3. Exhaustive switch handling
**Location:** TS lines 45-62

**TypeScript has explicit exhaustive handling:**
```typescript
default: {
  assertExhaustive(
    terminal,
    `Unexpected terminal kind \`${(terminal as any).kind}\``,
  );
}
```

**Rust:**
```rust
// All other terminal kinds: no action needed
_ => {}
```

**Difference:** Rust's `match` is exhaustive by default for enums. The `_` catch-all is needed but doesn't require a runtime assertion.

## Architectural Differences

### 1. Mutation pattern
- **TypeScript:** Can mutate `block.terminal` directly during iteration
- **Rust:** Must collect block IDs, then reborrow mutably to update terminals (lines 22-62)

### 2. retainWhere vs retain
- **TypeScript:** Uses utility function `retainWhere(activeLoops, id => id !== block.id)` (TS line 21)
- **Rust:** Uses built-in `active_loops.retain(|id| *id != block_id)` (line 26)

Both have identical semantics.

## Missing from Rust Port

### 1. assertExhaustive call
**Location:** TS lines 64-67

TypeScript includes a default case with `assertExhaustive()` for runtime checking. Rust's exhaustive enum matching makes this unnecessary at compile time.

## Additional in Rust Port
None.
