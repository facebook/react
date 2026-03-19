# Review: compiler/crates/react_compiler_diagnostics/src/lib.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/CompilerError.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIR.ts` (for `SourceLocation` / `GeneratedSource`)

## Summary
The Rust diagnostics crate captures the core error types, categories, and severity levels from the TypeScript `CompilerError.ts`. The structural mapping is reasonable but there are several notable divergences: the severity mapping uses a simplified approach that loses the per-category rule system, several methods and static factory functions from the TS `CompilerError` class are missing, the `SourceLocation` type diverges from the TS original (missing `filename` field, different column type), and the `disabledDetails` tracking is absent.

## Major Issues

1. **Severity for `EffectDependencies` is `Warning` in Rust but `Error` in TS**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:47`
   - In TS, `getRuleForCategoryImpl` at `CompilerError.ts:798` maps `EffectDependencies` to `severity: ErrorSeverity.Error`. The Rust `ErrorCategory::severity()` maps it to `ErrorSeverity::Warning`. This means errors in this category will be treated as warnings in Rust but errors in TS, potentially allowing compilation to proceed when it should not.

2. **Severity for `IncompatibleLibrary` is `Warning` in both, but TS also uses `Error` in `printErrorSummary`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:49` vs `CompilerError.ts:1041`
   - In TS, `getRuleForCategoryImpl` returns `severity: ErrorSeverity.Warning` for `IncompatibleLibrary` (line 1041), so the Rust severity mapping is actually correct here. However, the `printErrorSummary` function in TS (line 594) maps it to heading "Compilation Skipped" which matches the Rust `format_category_heading`. No issue here on closer inspection.

3. **`CompilerError.merge()` does not merge `disabledDetails`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:252`
   - In TS (`CompilerError.ts:434`), `merge()` also merges `other.disabledDetails` into `this.disabledDetails`. The Rust version only merges `details`, losing disabled/off-severity diagnostics during merges.

4. **Missing `disabledDetails` field on `CompilerError`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:190`
   - TS `CompilerError` (`CompilerError.ts:304`) has a `disabledDetails` array that stores diagnostics with `ErrorSeverity::Off`. The Rust `push_diagnostic` and `push_error_detail` methods silently drop off-severity items (lines 218, 225) instead of storing them separately.

## Moderate Issues

1. **`SourceLocation` missing `filename` field**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:83-86`
   - In TS, `SourceLocation` is `t.SourceLocation` from `@babel/types` which includes an optional `filename?: string | null` field. The Rust `SourceLocation` only has `start` and `end`. This means the `printErrorMessage` logic in TS that prints `${loc.filename}:${line}:${column}` (at `CompilerError.ts:184` and `CompilerError.ts:273`) cannot be replicated.

2. **`Position` uses `u32` for `line` and `column` instead of `number`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:89-92`
   - In TS, Babel's `Position` uses `number` (which is a 64-bit float). The Rust version uses `u32`. While this is unlikely to cause issues in practice, it is a type difference.

3. **`CompilerSuggestion` is a single struct instead of a discriminated union**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:72-77`
   - In TS (`CompilerError.ts:87-101`), `CompilerSuggestion` is a discriminated union: `Remove` operations do NOT have a `text` field, while `InsertBefore`/`InsertAfter`/`Replace` require a `text: string` field. The Rust version uses a single struct with `text: Option<String>`, losing the type-level guarantee that non-Remove ops always have text.

4. **Missing `CompilerError` static factory methods**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:210`
   - TS `CompilerError` has static methods: `invariant()` (line 307), `throwDiagnostic()` (line 333), `throwTodo()` (line 339), `throwInvalidJS()` (line 352), `throwInvalidReact()` (line 365), `throwInvalidConfig()` (line 371), `throw()` (line 384). None of these exist in Rust. Per architecture doc, these become `Err(CompilerDiagnostic)` returns, but there are no convenience constructors for common patterns.

5. **Missing `hasWarning()` and `hasHints()` methods on `CompilerError`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:210`
   - TS `CompilerError` has `hasWarning()` (line 495) and `hasHints()` (line 508). These are missing from the Rust implementation.

6. **Missing `push()` method on `CompilerError`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:210`
   - TS `CompilerError` has a `push(options)` method (line 449) that constructs a `CompilerErrorDetail` from options and adds it. The Rust version has no equivalent convenience method.

7. **Missing `asResult()` method on `CompilerError`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:210`
   - TS `CompilerError` has `asResult()` (line 476) that converts to a `Result<void, CompilerError>`. Not present in Rust.

8. **Missing `printErrorMessage()` and `withPrintedMessage()` on `CompilerError`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:210`
   - TS `CompilerError` has `printErrorMessage(source, options)` (line 421) and `withPrintedMessage()` (line 413). The Rust `Display` impl is a simplified version that doesn't support source code frames.

9. **Missing `printErrorMessage()` on `CompilerDiagnostic` and `CompilerErrorDetail`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:119,161`
   - Both TS classes have `printErrorMessage(source, options)` methods that generate formatted error messages with code frames. These are entirely absent in Rust.

10. **Missing `toString()` on `CompilerDiagnostic` and `CompilerErrorDetail`**
    - `compiler/crates/react_compiler_diagnostics/src/lib.rs:119,161`
    - TS `CompilerDiagnostic.toString()` (line 210) and `CompilerErrorDetail.toString()` (line 285) format error strings with location info. No Rust `Display` impl for these types.

11. **`CompilerError.has_any_errors()` name mismatch with TS `hasAnyErrors()`**
    - `compiler/crates/react_compiler_diagnostics/src/lib.rs:237`
    - Minor naming difference, but the Rust method is `has_any_errors()` while the TS is `hasAnyErrors()`. Both check `details.length > 0` / `!details.is_empty()`, so logic is equivalent.

12. **`format_category_heading` is not exhaustive**
    - `compiler/crates/react_compiler_diagnostics/src/lib.rs:301-311`
    - The Rust version uses a catch-all `_ => "Error"` for most categories. The TS `printErrorSummary` (`CompilerError.ts:565-611`) explicitly lists every category. If a new category is added to `ErrorCategory`, the Rust code will silently default to "Error" instead of causing a compile error, unlike the TS which uses `assertExhaustive`.

## Minor Issues

1. **`CompilerDiagnosticDetail` uses enum instead of discriminated union with `kind` field**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:99-107`
   - TS uses `{kind: 'error', ...} | {kind: 'hint', ...}`. Rust uses `enum CompilerDiagnosticDetail { Error {...}, Hint {...} }`. Functionally equivalent but structurally different for serialization -- the Rust version will serialize as `{"Error": {...}}` (tagged enum) vs `{"kind": "error", ...}` (inline discriminant).

2. **`CompilerDiagnostic` does not have `Serialize` derive**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:110-111`
   - `CompilerDiagnostic` derives `Debug, Clone` but not `Serialize`. The TS class is used in contexts where serialization is expected.

3. **`CompilerError` does not derive `Serialize`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:189`
   - Similarly, `CompilerError` and `CompilerErrorOrDiagnostic` don't derive `Serialize`.

4. **`CompilerError` does not extend `Error` semantically**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:189`
   - TS `CompilerError extends Error` and sets `this.name = 'ReactCompilerError'` (line 392). The Rust version implements `std::error::Error` trait (line 299) but has no equivalent of the `name` field.

5. **`CompilerError` missing `printedMessage` field**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:190`
   - TS `CompilerError` has `printedMessage: string | null` (line 305) used for caching formatted messages. Not present in Rust.

6. **`CompilerDiagnostic::new()` corresponds to `CompilerDiagnostic.create()` but signature differs**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:120-132`
   - TS `CompilerDiagnostic.create()` (line 129) takes an options object without `details`. The Rust `new()` takes individual parameters. Both initialize `details` to empty. The TS constructor (line 125) takes full `CompilerDiagnosticOptions` including `details`, which has no Rust equivalent.

7. **`CompilerDiagnostic` stores fields directly instead of wrapping in `options` object**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:111-117`
   - TS `CompilerDiagnostic` stores a single `options: CompilerDiagnosticOptions` property (line 123) and uses getters. Rust stores fields directly. Functionally equivalent.

8. **`CompilerDiagnostic::with_detail()` takes one detail; TS `withDetails()` takes variadic**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:138`
   - TS `withDetails(...details: Array<CompilerDiagnosticDetail>)` (line 151) accepts multiple details at once. Rust `with_detail()` takes a single detail per call.

9. **`ErrorCategory` enum values have no string representations**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:4-32`
   - TS `ErrorCategory` uses string values (e.g., `Hooks = 'Hooks'`). Rust uses unit variants. This affects serialization format.

10. **`ErrorSeverity` enum values have no string representations**
    - `compiler/crates/react_compiler_diagnostics/src/lib.rs:35-41`
    - TS `ErrorSeverity` uses string values (e.g., `Error = 'Error'`). Rust uses unit variants.

11. **Missing `CompilerDiagnosticOptions` type**
    - The TS has a `CompilerDiagnosticOptions` type (line 59) and `CompilerErrorDetailOptions` type (line 106) used as constructor arguments. Rust uses individual parameters instead.

12. **Missing `PrintErrorMessageOptions` type**
    - `CompilerError.ts:114-120`
    - TS has `PrintErrorMessageOptions` with `eslint: boolean` field used for formatting. Not present in Rust.

13. **Missing code frame formatting constants and functions**
    - `CompilerError.ts:16-35`
    - TS defines `CODEFRAME_LINES_ABOVE`, `CODEFRAME_LINES_BELOW`, `CODEFRAME_MAX_LINES`, `CODEFRAME_ABBREVIATED_SOURCE_LINES` and `printCodeFrame()` function. None present in Rust.

## Architectural Differences

1. **`SourceLocation` is `Option<SourceLocation>` instead of `SourceLocation | typeof GeneratedSource`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:82,95`
   - TS uses `const GeneratedSource = Symbol()` and `type SourceLocation = t.SourceLocation | typeof GeneratedSource`. Rust represents `GeneratedSource` as `None` via `Option<SourceLocation>`. This is documented in the Rust code comment (line 81) and is an expected architectural choice.

2. **`CompilerError` as struct vs class extending `Error`**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:189-193`
   - TS `CompilerError extends Error` and is used with `throw`/`catch`. Rust uses `Result<T, CompilerDiagnostic>` for propagation as documented in the architecture guide.

3. **`CompilerErrorOrDiagnostic` enum replaces union type**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:195-199`
   - TS uses `Array<CompilerErrorDetail | CompilerDiagnostic>`. Rust uses `Vec<CompilerErrorOrDiagnostic>` enum. Standard Rust pattern for discriminated unions.

4. **Builder pattern (`with_detail`, `with_description`, `with_loc`) instead of property access**
   - `compiler/crates/react_compiler_diagnostics/src/lib.rs:138,172,177`
   - TS classes use `options` objects and direct property access. Rust uses builder-style methods. Expected idiom difference.

## Missing TypeScript Features

1. **`LintRule` type and `getRuleForCategory()` / `getRuleForCategoryImpl()` functions** -- `CompilerError.ts:735-1052`. The entire lint rule system that maps categories to rule names, descriptions, and presets is absent. The Rust `ErrorCategory::severity()` is a simplified version that only returns severity without the full `LintRule` metadata.

2. **`LintRulePreset` enum** -- `CompilerError.ts:720-733`. The preset system (`Recommended`, `RecommendedLatest`, `Off`) is not present in Rust.

3. **`LintRules` export** -- `CompilerError.ts:1054-1056`. The array of all lint rules is not generated.

4. **`RULE_NAME_PATTERN` validation** -- `CompilerError.ts:765-773`. Rule name format validation is not present.

5. **`printCodeFrame()` function** -- `CompilerError.ts:525-563`. Source code frame printing with `@babel/code-frame` integration is not implemented.

6. **`printErrorMessage()` on all error types** -- Full error formatting with source code context is not available in Rust.

7. **`CompilerError.throwDiagnostic()`, `.throwTodo()`, `.throwInvalidJS()`, `.throwInvalidReact()`, `.throwInvalidConfig()`, `.throw()`** -- `CompilerError.ts:333-388`. Static factory methods for creating and throwing errors. In Rust these become `Err(...)` returns, but no convenience functions exist.

8. **`CompilerError.invariant()` assertion function** -- `CompilerError.ts:307-331`. The assertion-style invariant that throws on failure. In Rust, these are typically `.unwrap()` or manual checks returning `Err(...)`.
