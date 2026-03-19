# Review: compiler/crates/react_compiler/src/lib.rs

## Corresponding TypeScript file(s)
- `compiler/packages/babel-plugin-react-compiler/src/Entrypoint/index.ts`

## Summary
The Rust `lib.rs` serves as the crate root, re-exporting sub-modules and dependencies. The TS `index.ts` re-exports from all Entrypoint sub-modules. The Rust file is structurally equivalent but also re-exports lower-level crates for backward compatibility, which the TS version does not need to do.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

1. **Extra re-exports not in TS**: The Rust file re-exports `react_compiler_diagnostics`, `react_compiler_hir`, `react_compiler_hir as hir`, `react_compiler_hir::environment`, and `react_compiler_lowering::lower`. The TS `index.ts` only re-exports from `./Gating`, `./Imports`, `./Options`, `./Pipeline`, `./Program`, `./Suppression`. These are convenience re-exports for crate consumers and not a divergence per se.
   `/compiler/crates/react_compiler/src/lib.rs:6:1`

2. **Missing re-export of Reanimated**: The TS `index.ts` re-exports from `./Gating`, `./Imports`, `./Options`, `./Pipeline`, `./Program`, `./Suppression` but does not re-export `./Reanimated`. The Rust `mod.rs` also does not have a `reanimated` module, consistent with the TS index. No issue here.

## Architectural Differences
- The Rust crate root re-exports lower-level crates (`react_compiler_diagnostics`, `react_compiler_hir`, etc.) because Rust has a different module system where downstream crates may depend on `react_compiler` as a single entry point. The TS code uses direct imports between packages.
  `/compiler/crates/react_compiler/src/lib.rs:6:1`

## Missing TypeScript Features
- The TS `index.ts` re-exports `Reanimated.ts` functionality implicitly (it's not in the explicit re-export list, but `Reanimated.ts` exists in the Entrypoint directory). There is no corresponding Rust module for Reanimated. This is expected since Reanimated detection relies on Babel plugin pipeline introspection which is JS-only.
