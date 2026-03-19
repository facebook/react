# Review: compiler/crates/react_compiler_lowering/src/hir_builder.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIRBuilder.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/visitors.ts` (for `eachTerminalSuccessor`, `terminalFallthrough`)

## Summary
The Rust `HirBuilder` struct faithfully mirrors the TypeScript `HIRBuilder` class. The core CFG construction methods (`push`, `terminate`, `terminateWithContinuation`, `reserve`, `complete`, `enterReserved`, `enter`) are all present and structurally equivalent. The binding resolution (`resolveBinding`, `resolveIdentifier`, `isContextIdentifier`) has been adapted from Babel's scope API to use the serialized `ScopeInfo`. The post-build cleanup functions (`getReversePostorderedBlocks`, `markInstructionIds`, `markPredecessors`, `removeDeadDoWhileStatements`, `removeUnreachableForUpdates`, `removeUnnecessaryTryCatch`) are all ported. There are some notable differences in error handling, the instruction table architecture, and missing utility functions.

## Major Issues
None.

## Moderate Issues

1. **Missing `this` check in `resolve_binding_with_loc`**: In `HIRBuilder.ts:330-341`, `resolveBinding` checks if `node.name === 'this'` and records an `UnsupportedSyntax` error. The Rust `resolve_binding_with_loc` at `hir_builder.rs:656-754` only checks for `"fbt"` but does not check for `"this"`. This means functions using `this` would not get the expected error diagnostic.
   - Location: `hir_builder.rs:656`

2. **`markInstructionIds` does not detect duplicate instruction visits**: In `HIRBuilder.ts:817-831`, `markInstructionIds` maintains a `visited` Set of Instructions and asserts (via `CompilerError.invariant`) if an instruction was already visited. The Rust version at `hir_builder.rs:1135-1145` simply iterates through blocks and numbers instructions without any duplicate detection. If an instruction appears in multiple blocks (which would be a bug), the TS version would catch it but the Rust version would silently assign it the last ordering.
   - Location: `hir_builder.rs:1135-1145`

3. **`markPredecessors` uses `get_mut` + `get` pattern that prevents visiting missing blocks**: In `HIRBuilder.ts:838-863`, `markPredecessors` does `const block = func.blocks.get(blockId)!` which would panic if the block is missing but also has a null check. The Rust version at `hir_builder.rs:1162-1187` uses `hir.blocks.get_mut` which returns `None` silently for missing blocks. While the TS also has a null check (returning if `block == null`), the TS also has an invariant assertion after it (`CompilerError.invariant(block != null, ...)`). The Rust version lacks this assertion.
   - Location: `hir_builder.rs:1162-1170`

4. **`remove_unnecessary_try_catch` uses two-phase collect/apply**: The TS version at `HIRBuilder.ts:882-909` modifies blocks in-place during iteration. The Rust version at `hir_builder.rs:1087-1132` collects replacements first, then applies them. While functionally equivalent, the Rust version uses `shift_remove` for the fallthrough block deletion, which changes the block ordering. The TS uses `fn.blocks.delete(fallthroughId)` on a `Map` which does not affect iteration order.
   - Location: `hir_builder.rs:1126`

5. **`preds` uses `IndexSet` instead of `Set`**: Throughout, the Rust version uses `IndexSet<BlockId>` for predecessor sets (e.g., `hir_builder.rs:313`), while TS uses `Set<BlockId>`. The `IndexSet` preserves insertion order, which is fine but adds overhead. More importantly, at `hir_builder.rs:1026`, when creating unreachable fallthrough blocks, the Rust clones the original block's preds (`preds: block.preds.clone()`), while the TS at `HIRBuilder.ts:801` creates an empty preds set (`preds: new Set()`). This means unreachable blocks in Rust may incorrectly retain predecessor information from the original block.
   - Location: `hir_builder.rs:1026`

6. **`phis` uses `Vec` instead of `Set`**: The Rust uses `Vec::new()` for phis (e.g., `hir_builder.rs:314`) while TS uses `new Set()`. This means phis could contain duplicates in Rust. While this should not happen in practice during lowering (phis are empty at this stage), it is a structural divergence.
   - Location: `hir_builder.rs:314`

## Minor Issues

1. **`terminate` uses `std::mem::replace` with a sentinel BlockId**: At `hir_builder.rs:300-303`, when `next_block_kind` is `None`, the builder replaces `self.current` with a block having `BlockId(u32::MAX)`. In TS at `HIRBuilder.ts:409-424`, the method simply doesn't create a new block. The Rust approach works but the sentinel value (`u32::MAX`) could theoretically be confusing during debugging.
   - Location: `hir_builder.rs:300-303`

2. **`resolve_binding_with_loc` handles reserved words differently**: The TS `resolveBinding` at `HIRBuilder.ts:342-370` calls `makeIdentifierName(name)` which throws for reserved words (propagating as a compile error). The Rust version at `hir_builder.rs:696-713` checks `is_reserved_word` and records a diagnostic. The error category in Rust is `Syntax` while in TS the error propagates as a thrown exception caught by the pipeline.
   - Location: `hir_builder.rs:696-713`

3. **`each_terminal_successor` is a free function returning `Vec`**: In TS (`visitors.ts`), `eachTerminalSuccessor` is a generator function yielding block IDs. The Rust version at `hir_builder.rs:851-935` returns a `Vec<BlockId>`. This allocates for each call but is functionally equivalent.
   - Location: `hir_builder.rs:851`

4. **`terminal_fallthrough` returns `Option<BlockId>` like TS**: At `hir_builder.rs:895-935`, this matches the TS `terminalFallthrough` in `visitors.ts`. The logic appears equivalent.
   - Location: `hir_builder.rs:895`

5. **`enter` callback signature differs**: The TS `enter` at `HIRBuilder.ts:491-497` passes `blockId` to the callback: `fn: (blockId: BlockId) => Terminal`. The Rust `enter` at `hir_builder.rs:390-400` passes `(&mut Self, BlockId)` to the callback via `FnOnce(&mut Self) -> Terminal` (the blockId is available as `wip.id`). Actually, looking more carefully, the Rust `enter` signature is `f: impl FnOnce(&mut Self, BlockId) -> Terminal` which is equivalent.
   - Location: `hir_builder.rs:390`

6. **`loop_scope`, `label_scope`, `switch_scope` invariant checks**: The TS `loop`, `label`, and `switch` methods at `HIRBuilder.ts:499-573` all pop the scope and assert invariants about what was popped. The Rust equivalents at `hir_builder.rs:414-500` also pop and assert, but use `debug_assert!` which is only checked in debug builds. This means release builds would not catch scope mismatches.
   - Location: `hir_builder.rs:439-441`, `hir_builder.rs:467-469`, `hir_builder.rs:496-498`

7. **`lookupContinue` missing non-loop label check**: In TS at `HIRBuilder.ts:601-619`, `lookupContinue` has a special check: if a labeled statement is found that is NOT a loop, it throws an invariant error (`Continue may only refer to a labeled loop`). The Rust `lookup_continue` at `hir_builder.rs:519-540` does not have this check -- it only looks for loop scopes.
   - Location: `hir_builder.rs:519-540`

8. **`has_local_binding` method is Rust-specific**: At `hir_builder.rs:568-578`, this method has no direct TS equivalent. It checks whether a name resolves to a local (non-module) binding.
   - Location: `hir_builder.rs:568`

9. **`fbt_depth` is a public field**: At `hir_builder.rs:157` (constructor), `fbt_depth` is stored as a struct field, matching the TS `fbtDepth: number = 0` at `HIRBuilder.ts:122`. However, the TS declares it as a public property while the Rust stores it as a private field (accessed via methods). This is just an access pattern difference.

## Architectural Differences

1. **Instruction table architecture**: The Rust `HirBuilder` maintains an `instruction_table: Vec<Instruction>` at `hir_builder.rs:156` where instructions are stored, and blocks hold `Vec<InstructionId>` (indices into the table). The TS stores `Array<Instruction>` directly in blocks. This is a documented architectural difference per `rust-port-architecture.md` ("Instructions and EvaluationOrder" section).
   - Location: `hir_builder.rs:156`, `hir_builder.rs:272-273`

2. **`build()` returns instruction table**: The Rust `build()` at `hir_builder.rs:593-638` returns `(HIR, Vec<Instruction>, IndexMap<String, BindingId>, IndexMap<BindingId, IdentifierId>)`, while the TS `build()` at `HIRBuilder.ts:373-406` returns just `HIR`. The Rust returns the instruction table and binding maps because they need to be stored separately on `HirFunction`.
   - Location: `hir_builder.rs:593`

3. **`context` map uses `IndexMap<BindingId, Option<SourceLocation>>`**: In TS, context is `Map<t.Identifier, SourceLocation>` keyed by AST node identity. The Rust uses `BindingId` as key per the arena/ID pattern documented in the architecture guide.
   - Location: `hir_builder.rs:150`

4. **`bindings` map uses `IndexMap<BindingId, IdentifierId>`**: In TS, `Bindings` is `Map<string, {node: t.Identifier; identifier: Identifier}>` keyed by name string with AST node for identity comparison. The Rust maps `BindingId -> IdentifierId` directly, plus a separate `used_names: IndexMap<String, BindingId>` for name deduplication. This is a fundamental architectural difference due to not having AST node identity.
   - Location: `hir_builder.rs:151-152`

5. **Scope info and identifier locs stored on builder**: The Rust `HirBuilder` stores `scope_info: &'a ScopeInfo` and `identifier_locs: &'a IdentifierLocIndex` references at `hir_builder.rs:154,161`. These replace Babel's scope API and path API respectively.
   - Location: `hir_builder.rs:154,161`

6. **`function_scope` and `component_scope` stored on builder**: At `hir_builder.rs:158-159`, these are stored to support scope-based binding resolution. In TS, these are accessed through `this.#env.parentFunction.scope`.
   - Location: `hir_builder.rs:158-159`

## Missing TypeScript Features

1. **`_shrink` function**: The TS `_shrink` function at `HIRBuilder.ts:623-672` (prefixed with `_` indicating it's unused/dead code) is not ported. This is a CFG optimization that eliminates jump-only blocks. Since it appears to be dead code in TS as well, this is not a functional gap.

2. **`reversePostorderBlocks` (the standalone wrapper)**: The TS exports `reversePostorderBlocks` at `HIRBuilder.ts:716-719` as a convenience wrapper. The Rust exports `get_reverse_postordered_blocks` but does not have this wrapper that modifies the HIR in place.

3. **`clonePlaceToTemporary` function**: The TS exports `clonePlaceToTemporary` at `HIRBuilder.ts:929-935` which creates a new temporary Place sharing metadata with an original. This is not present in the Rust port.

4. **`fixScopeAndIdentifierRanges` function**: The TS exports `fixScopeAndIdentifierRanges` at `HIRBuilder.ts:940-955`. This is not present in the Rust port. It is used by later passes after scope inference.

5. **`mapTerminalSuccessors` function**: The TS imports and uses `mapTerminalSuccessors` from `visitors.ts`. This is not present in the Rust `hir_builder.rs`. It is used by the `_shrink` function (dead code) and by later passes.

6. **`getTargetIfIndirection` function**: The TS `getTargetIfIndirection` at `HIRBuilder.ts:870-876` is only used by `_shrink` (dead code) and is not ported.
