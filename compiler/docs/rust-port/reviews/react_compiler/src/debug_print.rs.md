# Review: compiler/crates/react_compiler/src/debug_print.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/HIR/PrintHIR.ts`

## Summary
The Rust `debug_print.rs` implements HIR pretty-printing for debug output, equivalent to `PrintHIR.ts` in the TS compiler. It provides a `debug_hir` public function that produces a text representation of the HIR for logging via `debugLogIRs`. The implementation is a standalone Rust reimplementation (~1500 lines) of the TS printing logic, using a `DebugPrinter` struct with indent/dedent methods. Due to the different HIR representation (arenas, ID types), the output format may differ from the TS version, though it aims to be structurally similar.

## Major Issues

1. **Output format may diverge from TS**: The Rust printer is a custom implementation that formats HIR into a text representation. The TS `printFunction`/`printHIR` functions produce a specific text format that test fixtures rely on for snapshot testing. If the Rust output format doesn't match the TS format exactly, fixture snapshots will differ. Without a line-by-line comparison of the full `PrintHIR.ts` (~1000+ lines), it's difficult to verify exact format equivalence.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

## Moderate Issues

1. **`DebugPrinter` struct approach vs free functions**: The TS `PrintHIR.ts` uses free functions like `printFunction(fn)`, `printHIR(hir)`, `printInstruction(instr)`, etc., each returning strings. The Rust version uses a `DebugPrinter` struct that accumulates output in a `Vec<String>` with mutable state (`indent_level`, `seen_identifiers`, `seen_scopes`). This structural difference means the Rust version tracks which identifiers and scopes have already been printed (to avoid duplicate definitions), while the TS version may or may not have similar dedup logic.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

2. **`seen_identifiers` and `seen_scopes` tracking**: The Rust printer tracks `seen_identifiers: HashSet<IdentifierId>` and `seen_scopes: HashSet<ScopeId>` to print identifier/scope details only on first occurrence. The TS version prints identifier details inline at every occurrence (via `printIdentifier`, `printPlace`, etc.). This means the Rust output may be more compact but structurally different from the TS output.
   `/compiler/crates/react_compiler/src/debug_print.rs:16:1`

3. **Missing `printFunctionWithOutlined`**: The TS has `printFunctionWithOutlined(fn)` which prints the main function plus all outlined functions from `fn.env.getOutlinedFunctions()`. The Rust `debug_hir` only prints the main function. Since outlining is not yet implemented in Rust, this is expected but should be added when outlining is ported.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

4. **Missing `printReactiveScopeSummary`**: The TS `PrintHIR.ts` imports and uses `printReactiveScopeSummary` from `PrintReactiveFunction.ts`. The Rust version does not print reactive scope summaries (reactive scopes are not yet fully implemented).
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

5. **Terminal printing may be incomplete**: The TS `printTerminal` function handles all terminal variants with specific formatting. Without reading the full Rust file, some terminal variants may be missing or formatted differently.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

6. **`InstructionValue` printing**: The TS `printInstructionValue` handles all ~50+ instruction value types. The Rust version needs to handle the same set. Any missing cases would cause debug output to omit information about those instruction types.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

## Minor Issues

1. **Two-space indent vs TS convention**: The Rust uses `"  ".repeat(self.indent_level)` (2 spaces per level). The TS default indent is also 2 spaces (`indent: 0` starting point with 2-space increments). Consistent.
   `/compiler/crates/react_compiler/src/debug_print.rs:35:1`

2. **`to_string_output` joins with `\n`**: The Rust output method joins all lines with `\n`. The TS builds strings by concatenation. Both produce newline-separated output.
   `/compiler/crates/react_compiler/src/debug_print.rs:46:1`

3. **`format_loc` helper**: The Rust has a local `format_loc` function for formatting `SourceLocation`. The TS uses inline formatting. Minor structural difference.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

## Architectural Differences

1. **Arena-based access**: The Rust printer accesses identifiers, scopes, and functions through arenas on `Environment` (e.g., `env.identifiers[id]`, `env.scopes[scope_id]`). The TS accesses these directly from the instruction/place objects. This is a fundamental difference documented in the architecture guide.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

2. **`&Environment` parameter**: The Rust `debug_hir` takes `&HirFunction` and `&Environment` as separate parameters. The TS `printFunction` takes just `fn: HIRFunction` since the environment is accessible via `fn.env`. Per the architecture guide, this separation is expected.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

3. **No reactive function printing**: The TS has `PrintReactiveFunction.ts` for printing the reactive IR. The Rust version only prints HIR since the reactive IR is not yet implemented.
   `/compiler/crates/react_compiler/src/debug_print.rs:14:1`

## Missing TypeScript Features

1. **`printFunctionWithOutlined`** - printing outlined functions alongside the main function.
2. **`printReactiveScopeSummary`** - printing reactive scope summaries on identifiers.
3. **`printReactiveFunction`** - the entire reactive function printing from `PrintReactiveFunction.ts`.
4. **`AliasingEffect` / `AliasingSignature` printing** - the TS printer formats aliasing effects and signatures. This may or may not be implemented in the Rust version (depends on which instruction values are fully handled).
5. **Some `InstructionValue` variants** may not be printed (needs line-by-line verification of all ~50+ variants).
