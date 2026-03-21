# Review: compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs

## Corresponding TypeScript Source
compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/PruneNonEscapingScopes.ts

## Summary
The Rust implementation is largely complete and follows the TypeScript architecture closely, implementing the core algorithm for pruning non-escaping reactive scopes. However, there are several significant differences in how the visitor pattern is implemented and a few semantic divergences that could affect correctness.

## Issues

### Major Issues

1. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:38-44**
   - **Issue**: Parameter declaration handling differs from TypeScript
   - **TS behavior**: Lines 119-125 - Checks `param.kind === 'Identifier'` vs else (spread pattern)
   - **Rust behavior**: Lines 38-44 - Pattern matches `ParamPattern::Place` vs `ParamPattern::Spread`
   - **Impact**: The TypeScript code checks for an `Identifier` kind on the param directly, but the Rust code assumes a different structure (`ParamPattern::Place` vs `ParamPattern::Spread`). This could be correct if the HIR structure differs, but needs verification that `ParamPattern::Place` corresponds to TypeScript's `param.kind === 'Identifier'`.

2. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:972-1207**
   - **Issue**: Manual visitor implementation instead of using trait-based visitor
   - **TS behavior**: Lines 126-1008 - Uses `visitReactiveFunction` with `CollectDependenciesVisitor` extending `ReactiveFunctionVisitor` base class
   - **Rust behavior**: Lines 972-1207 - Implements manual recursive functions (`visit_reactive_function_collect`, `visit_block_collect`, etc.) instead of implementing visitor trait
   - **Impact**: This is a structural difference that makes the code harder to maintain. The comment on line 971 says "We manually recurse since the visitor trait doesn't easily pass env + state together", but the TypeScript manages to pass both `env` and `state` through the visitor. The Rust visitor traits should be able to handle this. The manual implementation also doesn't align with the architecture principle of ~85-95% structural correspondence.

3. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:1137-1178**
   - **Issue**: `visit_value_collect` doesn't process all nested values correctly
   - **TS behavior**: Lines 442-477 - `computeMemoizationInputs` recursively processes nested values and returns their operands
   - **Rust behavior**: Lines 1137-1178 - `visit_value_collect` only visits nested structures but doesn't handle the `test` value in ConditionalExpression
   - **Impact**: Missing visit for the `test` value in ConditionalExpression (line 1167) - the function visits `test`, `consequent`, and `alternate`, which matches TS. Actually on review this appears correct. NOT AN ISSUE.

4. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:336-418**
   - **Issue**: `compute_memoization_inputs` doesn't handle nested ReactiveValue recursion completely
   - **TS behavior**: Lines 423-478 - For ConditionalExpression and LogicalExpression, recursively calls `computeMemoizationInputs` on branches and returns combined rvalues
   - **Rust behavior**: Lines 336-418 - Similar recursive pattern, but doesn't include the test value's rvalues in ConditionalExpression
   - **Impact**: The Rust implementation at lines 337-356 for `ConditionalExpression` doesn't process the `test` value's rvalues. TypeScript line 437 doesn't show the test being included in rvalues either (only consequent and alternate), so this appears correct. NOT AN ISSUE.

### Moderate Issues

5. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:211-220**
   - **Issue**: `is_mutable_effect` implementation differs from TypeScript
   - **TS behavior**: Lines 26 - Imports and uses `isMutableEffect` from HIR module
   - **Rust behavior**: Lines 211-220 - Defines local `is_mutable_effect` function with specific effect variants
   - **Impact**: The local implementation may diverge from the canonical `isMutableEffect` if that gets updated. Should use the HIR module's version if available. TypeScript imports this from `'../HIR'` suggesting it's a shared utility.

6. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:244-249**
   - **Issue**: `get_function_call_signature_no_alias` only checks `no_alias` field
   - **TS behavior**: Lines 741-743, 767-769 - Calls `getFunctionCallSignature(env, value.tag.identifier.type)` and checks `signature?.noAlias === true`
   - **Rust behavior**: Lines 244-249 - Gets function signature from env and returns `sig.no_alias` boolean
   - **Impact**: Functionally equivalent, but the Rust version doesn't match the pattern of the TypeScript which uses optional chaining. If `get_function_signature` can return `None`, this should handle it (which it does with `unwrap_or(false)`). Appears correct.

7. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:255-258**
   - **Issue**: Hook detection implementation
   - **TS behavior**: Line 919 - `getHookKind(state.env, callee.identifier) != null`
   - **Rust behavior**: Lines 255-258 - `env.get_hook_kind_for_type(ty).is_some()`
   - **Impact**: The TypeScript uses `getHookKind` with an identifier, while Rust uses `get_hook_kind_for_type` with a type. Need to verify these are equivalent. The Rust version extracts the type from the identifier first, which should be correct.

8. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:1213-1299**
   - **Issue**: `compute_memoized_identifiers` clones all node data into mutable structures
   - **TS behavior**: Lines 280-346 - Operates directly on mutable `State` class fields
   - **Rust behavior**: Lines 1213-1299 - Clones all identifier and scope nodes into new HashMaps at lines 1217-1225
   - **Impact**: This is inefficient and allocates unnecessary memory. The nodes should be mutated in place. The architecture guide says to use two-phase collect/apply when needed, but here the Rust code clones entire graphs. This is a performance issue but not a correctness issue.

9. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:320-322**
   - **Issue**: `enable_preserve_existing_memoization_guarantees` field access
   - **TS behavior**: Lines 410-412 - `this.env.config.enablePreserveExistingMemoizationGuarantees`
   - **Rust behavior**: Line 322 - `env.enable_preserve_existing_memoization_guarantees`
   - **Impact**: The Rust version accesses this field directly on `env` rather than `env.config`. Need to verify this field exists on Environment and not just on config. This could be a bug if the field is in the wrong location.

### Minor/Stylistic Issues

10. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:173-174**
    - **Issue**: Unused variable warning suppression
    - **TS behavior**: N/A
    - **Rust behavior**: Lines 173-174 - `let _ = node;` to avoid unused variable warning
    - **Impact**: This is a code smell. The code calls `entry().or_insert_with()` just for the side effect of ensuring the entry exists, but then doesn't use the returned mutable reference. The Rust idiom would be to not assign it at all, or restructure to use the reference.

11. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:878-884**
    - **Issue**: Synthetic Place construction for visit_operand calls
    - **TS behavior**: Lines 249-251, 870-875 - Calls `state.visitOperand(id, operand, operandId)` passing the actual Place
    - **Rust behavior**: Lines 878-884, 908-913 - Constructs synthetic Place with hardcoded fields: `effect: Effect::Read, reactive: false, loc: None`
    - **Impact**: The synthetic Place may not have the correct `effect`, `reactive`, or `loc` values from the original operand. The TypeScript passes the actual `operand` place. This could cause incorrect scope association if `get_place_scope` depends on place metadata beyond the identifier. Should pass the actual place from `aliasing_rvalues` and `aliasing_lvalues`.

12. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:1234-1241**
    - **Issue**: Redundant check for node existence
    - **TS behavior**: Lines 285-288 - Uses `CompilerError.invariant(node !== undefined, ...)` to assert node exists
    - **Rust behavior**: Lines 1234-1241 - Checks `if node.is_none() { return false; }` then accesses with `.unwrap()`
    - **Impact**: The TypeScript treats missing nodes as invariant violations, while Rust silently returns false. This could hide bugs where we expect a node to exist but it doesn't. Should use `.expect()` with an error message instead.

13. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:1276-1279**
    - **Issue**: Silent return on missing scope node
    - **TS behavior**: Lines 326-329 - Uses `CompilerError.invariant(node !== undefined, ...)` to assert node exists
    - **Rust behavior**: Lines 1276-1279 - Returns early if node is `None`
    - **Impact**: Same as issue #12 - should be an error, not silent failure.

14. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:1364**
    - **Issue**: InstructionKind comparison for Reassign
    - **TS behavior**: Line 1074 - `value.lvalue.kind === 'Reassign'`
    - **Rust behavior**: Line 1364 - `store_lvalue.kind == InstructionKind::Reassign`
    - **Impact**: Minor - this assumes `InstructionKind::Reassign` exists and matches TS 'Reassign' string. Should verify this enum variant exists.

15. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:47**
    - **Issue**: Custom visitor state tuple instead of struct
    - **TS behavior**: Lines 398-414 - Visitor holds `state: State` and tracks scopes via method parameter
    - **Rust behavior**: Line 46 - Uses tuple `(CollectState, Vec<ScopeId>)` for visitor state
    - **Impact**: Using a tuple makes the code less readable. Should define a struct like `struct VisitorState { state: CollectState, scopes: Vec<ScopeId> }` for clarity.

16. **compiler/crates/react_compiler_reactive_scopes/src/prune_non_escaping_scopes.rs:60**
    - **Issue**: Variable named `memoized_state` but it's actually the memoized set
    - **TS behavior**: Line 135 - `const memoized = computeMemoizedIdentifiers(state);` then passes to `visitReactiveFunction(fn, new PruneScopesTransform(), memoized)`
    - **Rust behavior**: Line 59 - `let mut memoized_state = memoized;`
    - **Impact**: Misleading variable name. Should be `let mut memoized = memoized;` or just use `memoized` directly.

## Architectural Differences

17. **Visitor Pattern Implementation**
    - TypeScript uses the base `ReactiveFunctionVisitor` class with override methods (`visitInstruction`, `visitTerminal`, `visitScope`)
    - Rust implements manual recursive functions instead of using the `ReactiveFunctionVisitor` trait
    - The Rust implementation doesn't align with the architectural pattern used in other passes
    - The comment suggests this was due to difficulty passing `env + state`, but other Rust passes manage this

18. **Mutability Pattern**
    - TypeScript mutates `State` fields directly throughout the visitor
    - Rust clones entire node graphs in `compute_memoized_identifiers` for mutability
    - This violates the architecture guide's recommendation to use two-phase collect/apply or careful borrow management

19. **Error Handling**
    - TypeScript uses `CompilerError.invariant()` for missing nodes (would throw)
    - Rust silently returns false/None for missing nodes in several places
    - Should use `.expect()` or return `Result<>` for errors

## Completeness

### Implemented
- ✅ Core algorithm for collecting dependencies and computing memoization
- ✅ MemoizationLevel enum and joining logic
- ✅ Pattern matching for all ReactiveValue and InstructionValue variants
- ✅ Scope pruning logic in PruneScopesTransform
- ✅ Reassignment tracking for useMemo inlining
- ✅ FinishMemoize pruned flag setting

### Missing/Incomplete
- ❌ Proper visitor trait usage (uses manual recursion instead)
- ❌ Invariant checks for missing nodes (uses silent returns)
- ❌ Using actual Place values from operands (constructs synthetic Places)
- ⚠️ Needs verification: `enable_preserve_existing_memoization_guarantees` field location
- ⚠️ Needs verification: `ParamPattern` variants match TypeScript param.kind semantics
- ⚠️ Should use shared `is_mutable_effect` from HIR module if available

## Recommendations

1. **High Priority**: Fix the synthetic Place construction (issue #11) - pass actual places to `visit_operand`
2. **High Priority**: Add proper error handling for missing nodes (issues #12, #13) - use `.expect()` with messages
3. **High Priority**: Verify `enable_preserve_existing_memoization_guarantees` field location (issue #9)
4. **Medium Priority**: Refactor to use proper visitor traits instead of manual recursion (issue #2)
5. **Medium Priority**: Fix memory inefficiency in `compute_memoized_identifiers` (issue #8)
6. **Medium Priority**: Use shared `is_mutable_effect` function from HIR module (issue #5)
7. **Low Priority**: Rename `memoized_state` to `memoized` (issue #16)
8. **Low Priority**: Replace visitor state tuple with named struct (issue #15)
9. **Low Priority**: Remove unused variable workaround (issue #10)
