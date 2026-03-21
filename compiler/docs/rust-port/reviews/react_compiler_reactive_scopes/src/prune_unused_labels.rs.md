# Review: compiler/crates/react_compiler_reactive_scopes/src/prune_unused_labels.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PruneUnusedLabels.ts`

## Summary
This pass flattens labeled terminals where the label is not reachable via break/continue, and marks remaining unused labels as implicit. The Rust port correctly implements most logic but has one notable divergence in handling trailing breaks.

## Issues

### Major Issues
None found.

### Moderate Issues

1. **prune_unused_labels.rs:64-72 - Different handling of trailing break removal**
   - **TS Behavior**: Lines 47-56 attempts to pop a trailing break with `last.terminal.target === null`, then does `block.pop()`
   - **Rust Behavior**: Lines 64-72 has a comment explaining this check is skipped because "target is always a BlockId (number), that check is always false, so the trailing break is never removed"
   - **Impact**: Moderate - The TS code has dead code (the null check never succeeds), but the Rust port correctly identifies this and skips it. However, this creates a potential divergence if the TS version is "fixed" to actually remove trailing breaks.
   - **Divergence Reason**: In both TS and Rust, break targets are always BlockId (never null), so the TS check for `target === null` is unreachable
   - **Note**: This is actually a bug fix in Rust - the TS code is incorrect. The comment in Rust explains this well.
   - **Recommendation**: Document this as an intentional improvement, but note that it changes output if TS is ever fixed

### Minor/Stylistic Issues

1. **prune_unused_labels.rs:69 - Uses std::mem::take instead of clone**
   - **TS Behavior**: Line 48 uses `const block = [...stmt.terminal.block]` which creates a copy
   - **Rust Behavior**: Line 69 uses `std::mem::take(block)` which moves the vec
   - **Impact**: None - std::mem::take is more efficient (no copy) and idiomatic Rust
   - **Note**: This is a good optimization

2. **prune_unused_labels.rs:23-24 - Type alias not used**
   - **TS Behavior**: Line 29 declares `type Labels = Set<BlockId>`
   - **Rust Behavior**: Directly uses `HashSet<BlockId>` in the trait impl instead of a type alias
   - **Impact**: None - both approaches work fine
   - **Recommendation**: Could add `type Labels = HashSet<BlockId>;` for consistency with TS

## Architectural Differences

1. **Transform ownership**: Rust's `transform_terminal` takes `&mut self` and `&mut stmt` allowing in-place modification, while TS receives immutable `stmt` and returns transformed values. The Rust approach is more direct for this use case.

2. **Block flattening**: Rust uses `std::mem::take` to move the block vec, while TS creates a copy with spread operator. Rust's approach is more efficient.

3. **Label collection**: Both versions collect labeled break/continue targets into a set, then check label reachability - logic is identical.

## Completeness

The pass is complete and correctly implements the label pruning logic.

### Comparison to TypeScript

| Feature | TypeScript | Rust | Status |
|---------|-----------|------|--------|
| Collect labeled targets | ✓ | ✓ | ✓ Complete |
| Check label reachability | ✓ | ✓ | ✓ Complete |
| Flatten unreachable labels | ✓ | ✓ | ✓ Complete |
| Mark unused labels implicit | ✓ | ✓ | ✓ Complete |
| Remove trailing break | ✗ (dead code) | ✗ (intentionally skipped) | ✓ Correctly omitted |

## Recommendations

1. **Document the trailing break divergence**: Add a note in the commit message or documentation that the Rust version intentionally omits the broken trailing-break removal logic from TS
2. **Consider adding type alias**: Add `type Labels = HashSet<BlockId>` for better correspondence with TS
3. **Update TS version**: Consider submitting a PR to remove the dead code in the TS version (the `target === null` check and subsequent `block.pop()`)
