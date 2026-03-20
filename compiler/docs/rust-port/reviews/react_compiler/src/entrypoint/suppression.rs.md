# Review: react_compiler/src/entrypoint/suppression.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Suppression.ts`

## Summary
Complete port of suppression detection logic (eslint-disable and Flow suppressions). All core logic correctly ported.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Comment data extraction (suppression.rs:33-37)
Helper function `comment_data` matches both Comment variants. TypeScript accesses properties directly. This is cleaner in Rust.

### 2. Regex escaping (suppression.rs:78)
Flow suppression pattern uses raw string: `r"\$(FlowFixMe\w*|FlowExpectedError|FlowIssue)\[react\-rule"`
TypeScript uses: `'\\$(FlowFixMe\\w*|FlowExpectedError|FlowIssue)\\[react\\-rule'`

Both patterns are equivalent, Rust uses raw string to avoid double-escaping.

## Architectural Differences

### 1. SuppressionRange struct vs type alias (suppression.rs:27-31 vs Suppression.ts:27-31)
**Rust**:
```rust
pub struct SuppressionRange {
    pub disable_comment: CommentData,
    pub enable_comment: Option<CommentData>,
    pub source: SuppressionSource,
}
```

**TypeScript**:
```typescript
export type SuppressionRange = {
  disableComment: t.Comment;
  enableComment: t.Comment | null;
  source: SuppressionSource;
};
```

**Intentional**: Rust uses `CommentData` (owned) instead of `t.Comment` (reference). This avoids lifetime issues. The data contains start/end/value/loc which is all that's needed.

### 2. Suppression filtering (suppression.rs:143-182 vs Suppression.ts:40-77)
Both implement identical logic but with different iteration styles:
- Rust: explicit iteration with `for suppression in suppressions`
- TS: same pattern with `for (const suppressionRange of suppressionRanges)`

Logic is identical, including the two conditions (suppression within function, suppression wraps function).

## Missing from Rust Port
None - all functionality present.

## Additional in Rust Port

### 1. comment_data helper (suppression.rs:33-37)
Extracts `CommentData` from `Comment` enum. TypeScript doesn't need this since comments are objects with direct property access.

### 2. Explicit CommentData usage
Stores `CommentData` (owned) instead of `&Comment` (reference). This is necessary for Rust's ownership model and avoids lifetime complexity.
