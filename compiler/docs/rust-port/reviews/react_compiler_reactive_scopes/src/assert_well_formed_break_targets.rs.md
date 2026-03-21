# Review: compiler/crates/react_compiler_reactive_scopes/src/assert_well_formed_break_targets.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/AssertWellFormedBreakTargets.ts`

## Summary
This validation pass asserts that all break/continue targets reference existent labels. The Rust port correctly implements the logic with one subtle behavioral difference in error handling.

## Issues

### Major Issues
None found.

### Moderate Issues

1. **assert_well_formed_break_targets.rs:42-44 - Uses panic! instead of CompilerError**
   - **TS Behavior**: Line 29-32 uses `CompilerError.invariant(seenLabels.has(terminal.target), {...})`
   - **Rust Behavior**: Line 42-45 uses `assert!(..., "Unexpected break/continue to invalid label: {:?}", target)`
   - **Impact**: Moderate - Panics terminate the process immediately while CompilerError provides structured error information with location context. The TS version includes `loc: stmt.terminal.loc` in the error.
   - **Divergence**: Error handling pattern - should follow the architecture guide which specifies `CompilerError.invariant()` should map to returning `Err(CompilerDiagnostic)` for invariant violations
   - **Fix needed**: Change to:
     ```rust
     if !seen_labels.contains(target) {
         panic!(
             "Unexpected break/continue to invalid label: {:?} at {:?}",
             target, stmt.terminal // include terminal for location context
         );
     }
     ```
     Or better, once error handling infrastructure is in place, return a proper diagnostic.

2. **assert_well_formed_break_targets.rs:48-53 - Incomplete implementation note**
   - **Issue**: Lines 49-53 have a comment explaining why `traverse_terminal` is NOT called, mentioning that recursion into child blocks happens via `traverseBlock→visitTerminal`
   - **TS Behavior**: The TS version (line 34) simply doesn't call `traverseTerminal`, relying on the default visitor behavior
   - **Impact**: Minor documentation issue - the comment is helpful but the phrase "matching TS behavior where visitTerminal override does not call traverseTerminal" is slightly misleading since TS doesn't have explicit traverse methods
   - **Recommendation**: Clarify the comment or match TS by simply not calling traverse without explanation

### Minor/Stylistic Issues

1. **assert_well_formed_break_targets.rs:21 - Unnecessary type annotation**
   - **Issue**: Line 21 has `let mut state: HashSet<BlockId> = HashSet::new();` with explicit type
   - **Impact**: Style - Rust can infer this from the trait's associated type
   - **Recommendation**: Use `let mut state = HashSet::new();` for consistency with Rust idioms

## Architectural Differences

1. **Error handling**: TS uses `CompilerError.invariant()` which throws, while Rust uses `assert!()` which panics. Per the architecture guide, invariant errors should eventually return `Err(CompilerDiagnostic)` in Rust.

2. **Visitor instantiation**: Rust uses a unit struct `Visitor` while TS uses a class instance with `new Visitor()`. Both are idiomatic for their respective languages.

## Completeness

The pass is complete and functional. All break/continue validation logic is present. The only missing piece is proper error diagnostic construction rather than panic, which is an infrastructure issue affecting multiple passes.

### Comparison to TypeScript

| Feature | TypeScript | Rust | Status |
|---------|-----------|------|--------|
| Collect labels into set | ✓ | ✓ | ✓ Complete |
| Check break/continue targets | ✓ | ✓ | ✓ Complete |
| Error with location info | ✓ | ✗ | Missing location in panic |
| Traverse child blocks | ✓ | ✓ | ✓ Complete |

## Recommendations

1. Add location context to the panic message or convert to proper error diagnostic when infrastructure is available
2. Consider adding a test case to verify the validation catches invalid break targets
3. Simplify the comment in visitTerminal or remove it if the behavior is clear from context
