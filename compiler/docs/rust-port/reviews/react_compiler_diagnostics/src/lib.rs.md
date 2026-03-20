# Review: react_compiler_diagnostics/src/lib.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/CompilerError.ts`
- `compiler/packages/babel-plugin-react-compiler/src/HIR/Environment.ts` (error handling methods)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/HIR.ts` (SourceLocation type)

## Summary
The Rust diagnostics crate provides a faithful port of the TypeScript error/diagnostic system with all 32 error categories, severity levels, suggestions, and both new-style diagnostics and legacy error details. The implementation maintains structural correspondence while adapting to Rust idioms (Result types, no class methods for static functions, simplified Display trait).

## Major Issues

None found. The port correctly implements all essential functionality.

## Moderate Issues

### Missing `LintRule` and `getRuleForCategory` functionality
**File:** `compiler/crates/react_compiler_diagnostics/src/lib.rs`

The TypeScript source includes a comprehensive `LintRule` system with:
- `LintRule` type with fields: `category`, `severity`, `name`, `description`, `preset`
- `LintRulePreset` enum (Recommended, RecommendedLatest, Off)
- `getRuleForCategory()` function that maps each ErrorCategory to its lint rule configuration (lines 767-1052 in CompilerError.ts)
- `LintRules` array exporting all rules (line 1054-1056 in CompilerError.ts)

This is used by ESLint integration and documentation generation. The Rust port omits this entirely.

**Recommendation:** If the Rust compiler will eventually need ESLint integration or rule configuration, this should be ported. If not needed for the current Rust use case, document the intentional omission.

### Missing static factory methods
**File:** `compiler/crates/react_compiler_diagnostics/src/lib.rs`

TypeScript `CompilerError` class has static factory methods (lines 307-388):
- `CompilerError.invariant()` - assertion with automatic error creation
- `CompilerError.throwDiagnostic()` - throws a single diagnostic
- `CompilerError.throwTodo()` - throws a Todo error
- `CompilerError.throwInvalidJS()` - throws a Syntax error
- `CompilerError.throwInvalidReact()` - throws a general error
- `CompilerError.throwInvalidConfig()` - throws a Config error
- `CompilerError.throw()` - general error throwing

The Rust port has no equivalent convenience constructors. In Rust these would typically be implemented as associated functions like `CompilerError::invariant(...)` or as standalone helper functions.

**Impact:** Moderate - makes error creation more verbose at call sites, but functionally equivalent using manual construction.

### Missing code frame printing functionality
**File:** `compiler/crates/react_compiler_diagnostics/src/lib.rs`

TypeScript includes comprehensive source code frame printing (lines 165-208, 259-282, 421-430, 525-563):
- `printCodeFrame()` function with Babel integration
- `printErrorMessage()` method on both CompilerDiagnostic and CompilerErrorDetail
- Configurable line counts (CODEFRAME_LINES_ABOVE, CODEFRAME_LINES_BELOW, etc.)
- ESLint vs non-ESLint formatting
- Support for abbreviating long error spans

Rust port has only a simple `Display` implementation (lines 276-297) with no code frame support.

**Impact:** Moderate - affects developer experience when viewing errors, but doesn't impact correctness of compilation.

## Minor Issues

### Missing `CompilerError::hasWarning()` and `hasHints()` methods
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs:210-268`

TypeScript has three granular check methods (lines 492-522):
- `hasErrors()` - returns true if any error has Error severity
- `hasWarning()` - returns true if there are warnings but no errors
- `hasHints()` - returns true if there are hints but no errors/warnings

Rust only implements:
- `has_errors()` (line 231-235) - matches TS `hasErrors()`
- `has_any_errors()` (line 237-239) - matches TS `hasAnyErrors()`
- `has_invariant_errors()` (line 242-250) - checks for Invariant category
- `is_all_non_invariant()` (line 259-267) - inverse of has_invariant_errors

**Missing:** `has_warning()` and `has_hints()` equivalents.

**Impact:** Minor - only affects how errors are categorized in reporting, not core functionality.

### TypeScript `CompilerError` extends `Error`, Rust uses `std::error::Error`
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs:276-300`

TypeScript `CompilerError` extends JavaScript's `Error` class (line 302), storing `printedMessage` (line 305) and customizing `message` getter/setter (lines 397-401).

Rust implements `std::error::Error` trait (line 299) and `Display` (lines 276-297), which is the idiomatic equivalent. The `Display` implementation doesn't cache the message like TS's `printedMessage`.

**Assessment:** This is an intentional architectural difference. Rust's approach is more idiomatic. No issue.

### Missing `CompilerError::withPrintedMessage()` method
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs`

TypeScript has `withPrintedMessage(source: string, options: PrintErrorMessageOptions)` (lines 413-419) that caches a formatted message.

Rust has no equivalent. This would require adding a `printed_message: Option<String>` field and implementing the caching logic.

**Impact:** Minor - affects performance when formatting errors multiple times, but not core functionality.

### Missing `CompilerError::asResult()` method
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs`

TypeScript has `asResult()` (lines 476-478) that returns `Result<void, CompilerError>` based on `hasAnyErrors()`.

This would be useful in Rust to convert a `CompilerError` to `Result<(), CompilerError>`. However, the Rust error handling pattern uses `Result` returns directly rather than accumulating and converting.

**Impact:** Minor - convenience method, not essential.

### Missing `disabledDetails` field
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs:189-193`

TypeScript `CompilerError` has both `details` and `disabledDetails` arrays (line 304). Errors with `ErrorSeverity.Off` go into `disabledDetails`.

Rust only stores errors that are not `Off` severity (lines 218-221, 224-228), effectively discarding disabled details.

**Impact:** Minor - affects debugging/logging scenarios where you want to see what was filtered out.

### `CompilerSuggestion::text` is `Option<String>` vs TypeScript union type
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs:70-77`

TypeScript uses a union type (lines 87-101) where Remove operations don't have a `text` field, but Insert/Replace operations require it.

Rust uses a single struct with `text: Option<String>` and a comment `// None for Remove operations`.

**Assessment:** This is acceptable. The TypeScript pattern is more type-safe, but Rust's approach is simpler and functionally equivalent with runtime checking. Could be improved with an enum but not critical.

### Position uses `u32` vs TypeScript's implicit number
**Location:** `compiler/crates/react_compiler_diagnostics/src/lib.rs:88-92`

Rust uses `u32` for line/column numbers. TypeScript uses `number` (JavaScript's default).

Babel's Position type uses `number` as well. This is fine as long as positions don't exceed u32::MAX (4 billion).

**Assessment:** Acceptable - no real-world source file will have 4 billion lines.

## Architectural Differences

### SourceLocation representation
**TypeScript:** Uses Babel's `t.SourceLocation | typeof GeneratedSource` where `GeneratedSource = Symbol()` (HIR.ts:40-41)

**Rust:** Uses `Option<SourceLocation>` where `None` represents generated source (lib.rs:95)

**Assessment:** This is the correct adaptation. Rust doesn't have symbols, and `Option` is the idiomatic way to represent "value or absence."

### Filename handling in SourceLocation
**TypeScript:** SourceLocation has an optional `filename` field (checked on lines 184, 274)

**Rust:** SourceLocation has no filename field (lib.rs:82-86)

**Impact:** The Rust version cannot store the filename with the location. This might be stored separately in the Rust architecture. The architecture doc doesn't mention this, suggesting filename might be stored elsewhere (likely on Environment).

**Recommendation:** Verify that filename information is available where needed for error reporting.

### Error as Result vs Throw
**TypeScript:** Uses `throw` for errors, caught by try/catch

**Rust:** Uses `Result<T, CompilerDiagnostic>` return type (documented in rust-port-architecture.md:87-96)

**Assessment:** This is the documented architectural difference. Rust passes use `?` to propagate errors.

### No class methods, only free functions or associated functions
**TypeScript:** Has class methods like `CompilerError.invariant()`, `CompilerError.throwTodo()`, etc.

**Rust:** Would use associated functions like `CompilerError::invariant()` or free functions

**Assessment:** Idiomatic difference between languages. Not currently implemented in Rust port.

## Missing from Rust Port

1. **LintRule system** - `LintRule` type, `LintRulePreset` enum, `getRuleForCategory()` function, `LintRules` array (CompilerError.ts:720-1056)

2. **PrintErrorMessageOptions type** - Configuration for error formatting (CompilerError.ts:114-120)

3. **Code frame printing** - `printCodeFrame()` function and codeframe constants (CompilerError.ts:15-35, 525-563)

4. **Error printing methods** - `printErrorMessage()` on CompilerDiagnostic and CompilerErrorDetail (CompilerError.ts:165-208, 259-282, 421-430)

5. **Static factory methods on CompilerError** - `invariant()`, `throwDiagnostic()`, `throwTodo()`, `throwInvalidJS()`, `throwInvalidReact()`, `throwInvalidConfig()`, `throw()` (CompilerError.ts:307-388)

6. **CompilerError fields** - `disabledDetails`, `printedMessage`, `name` (CompilerError.ts:304-306, 392)

7. **CompilerError methods** - `withPrintedMessage()`, `asResult()`, `hasWarning()`, `hasHints()` (CompilerError.ts:413-522)

8. **Filename in SourceLocation** - TypeScript's SourceLocation includes optional filename field

## Additional in Rust Port

1. **`has_invariant_errors()` method** - Checks if any error has Invariant category (lib.rs:242-250). TypeScript doesn't have this specific helper.

2. **`is_all_non_invariant()` method** - Checks if all errors are non-invariant (lib.rs:259-267). Used for logging CompileUnexpectedThrow per the comment, but no direct TS equivalent.

3. **Simplified Display trait** - Rust implements Display for formatting (lib.rs:276-297) rather than complex toString/message getters.

4. **Separate `GENERATED_SOURCE` constant** - Rust exports this as a named constant (lib.rs:95) whereas TypeScript uses the symbol directly.

5. **Direct category-to-severity mapping** - Rust implements `ErrorCategory::severity()` method (lib.rs:44-59) whereas TypeScript calls `getRuleForCategory(category).severity` (CompilerError.ts:142-143, 242-243).

## Overall Assessment

The Rust diagnostics crate provides a solid, faithful port of the core error handling types and categories. All 32 error categories are present with correct severity mappings. The main omissions are:

1. **ESLint/Lint rule integration** - Likely not needed yet for pure Rust compiler
2. **Code frame printing** - Important for UX but not for correctness
3. **Convenience factory methods** - Makes error creation more verbose but functionally complete

The port correctly adapts TypeScript patterns to Rust idioms (Option instead of Symbol for GeneratedSource, Result instead of throw, Display instead of toString). The structural correspondence is high (~90%), with differences mainly in presentation/formatting rather than core functionality.

**Recommendation:** This is production-ready for a Rust compiler pipeline that returns Result types. If interactive error reporting or ESLint integration is needed, implement the code frame printing and lint rule system. Otherwise, the current implementation is sufficient.
