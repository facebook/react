---
description: Conventions for Rust port code in compiler/crates
globs:
  - compiler/crates/**/*.rs
  - compiler/crates/**/Cargo.toml
---

When working on Rust code in `compiler/crates/`:

- Follow patterns from `compiler/docs/rust-port/rust-port-notes.md`
- Use arenas + copyable IDs instead of shared references: `IdentifierId`, `ScopeId`, `FunctionId`, `TypeId`
- Pass `env: &mut Environment` separately from `func: &mut HirFunction`
- Use two-phase collect/apply when you can't mutate through stored references
- Run `bash compiler/scripts/test-babel-ast.sh` to test AST round-tripping
- Use `/port-pass <name>` when porting a new compiler pass
- Use `/compiler-verify` before committing to run both Rust and TS tests
- Keep Rust code structurally close to the TypeScript (~85-95% correspondence)
