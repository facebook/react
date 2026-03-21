# Review: compiler/crates/react_compiler_validation/src/validate_exhaustive_dependencies.rs

## Corresponding TypeScript Source
`compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateExhaustiveDependencies.ts`

## Summary
Large-scale port implementing exhaustive dependency validation for useMemo/useEffect. Generally accurate but has several significant divergences in error handling and some logic completeness issues.

## Issues

### Major Issues

1. **validate_exhaustive_dependencies.rs:21-25** - Different error accumulation pattern
   - TS behavior: Uses `env.tryRecord()` wrapper which catches thrown `CompilerError`s and accumulates them
   - Rust behavior: Returns `()` void, all errors pushed directly to `env.errors`
   - Impact: The pass doesn't use Result<> for fatal errors like invariants, which could mask issues
   - TS line 90 shows the function signature returns void but can throw invariants

2. **validate_exhaustive_dependencies.rs - Missing DEBUG constant and logging**
   - TS has `const DEBUG = false` (line 49) with conditional console.log statements throughout (lines 165-168, 292-302)
   - Rust: No debug logging infrastructure
   - Impact: Harder to debug validation issues in development

3. **validate_exhaustive_dependencies.rs:703-708** - Incomplete `find_optional_places` implementation
   - TS `findOptionalPlaces` (lines 958-1039): Complex 80-line function handling optional chaining
   - Rust: Function exists but implementation details not visible in the excerpt
   - Need to verify: Full implementation of optional terminal handling including `sequence`, `maybe-throw`, nested optionals

### Moderate Issues

1. **validate_exhaustive_dependencies.rs:172-193** - `validate_effect` callback differences
   - TS (lines 161-216): Constructs `ManualMemoDependency` objects from inferred dependencies with proper Effect::Read and reactive flags
   - Rust (lines 172-193): Similar construction but using different field access patterns
   - Impact: Need to verify that `reactive` flag computation is identical

2. **validate_exhaustive_dependencies.rs:241-253** - Dependency sorting differs slightly
   - TS (lines 230-276): Sorts by name, then path length, then optional flag, then property name
   - Rust (lines 241-253): Similar logic but condensed
   - Potential issue: Line 248-249 sorts by `aOptional - bOptional` which should sort non-optionals (1) before optionals (0), matching TS line 257

3. **validate_exhaustive_dependencies.rs:560-586** - `collect_dependencies` parameter differences
   - TS (line 589): Takes `isFunctionExpression: boolean` parameter
   - Rust: Missing this parameter visibility in function signature
   - Impact: Need to verify recursive calls pass correct value

### Minor/Stylistic Issues

1. **validate_exhaustive_dependencies.rs:60-67** - Temporary struct differences
   - TS uses discriminated union `Temporary` with `kind: 'Local' | 'Global' | 'Aggregate'`
   - Rust uses enum `Temporary`
   - This is fine, just documenting the idiomatic difference

2. **validate_exhaustive_dependencies.rs:26** - Direct env access vs parameter
   - TS: Accesses `fn.env.config` (line 92)
   - Rust: Takes `env: &mut Environment` parameter and accesses `env.config`
   - This follows Rust architecture, not an issue

## Architectural Differences

1. **Error handling** - TS can throw invariants mid-validation; Rust accumulates all errors and returns void
2. **Arena access** - Standard pattern of indexing into `env.identifiers`, `env.functions`, `env.scopes` vs TS direct access
3. **Helper function organization** - Many helper functions extracted (e.g., `print_inferred_dependency`, `create_diagnostic`) vs TS inline

## Completeness

**Potentially Missing:**
1. DEBUG logging infrastructure (lines 49, 165-168, 292-302 in TS)
2. Full `find_optional_places` implementation verification needed
3. Verify `is_optional_dependency` logic matches TS lines 1041-1050
4. Verify all `collect_dependencies` callbacks (`onStartMemoize`, `onFinishMemoize`, `onEffect`) match TS behavior exactly

**Present:**
- Core dependency collection logic
- Manual vs inferred dependency comparison
- Missing/extra dependency detection
- Proper suggestions generation
- Effect validation
- Memoization validation
