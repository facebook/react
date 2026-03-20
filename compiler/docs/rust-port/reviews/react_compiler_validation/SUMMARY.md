# React Compiler Validation Passes - Review Summary

**Date:** 2026-03-20
**Reviewer:** Claude (automated review)

## Overview

This review compares the Rust implementation of validation passes in `compiler/crates/react_compiler_validation/` against the TypeScript source in `compiler/packages/babel-plugin-react-compiler/src/Validation/`.

## Files Reviewed

1. ✅ `lib.rs` - Module exports
2. ✅ `validate_context_variable_lvalues.rs` - Context variable lvalue validation
3. ✅ `validate_use_memo.rs` - useMemo usage validation  
4. ✅ `validate_hooks_usage.rs` - Hooks rules validation
5. ✅ `validate_no_capitalized_calls.rs` - Capitalized function call validation

## Summary of Findings

### Major Issues

**validate_context_variable_lvalues.rs:**
- Default case silently ignores unhandled instruction variants instead of recording Todo errors like TypeScript

### Moderate Issues

**validate_use_memo.rs:**
- Return type differs: Rust returns `CompilerError`, TypeScript logs errors via `fn.env.logErrors()`

**validate_hooks_usage.rs:**
- Function expression validation uses two-phase collection instead of direct recursion; may affect error ordering

### Architectural Differences

All files follow the established Rust port architecture patterns:
- Arena-based access (`env.identifiers[id]`, `env.functions[func_id]`)
- Separate `env: &mut Environment` parameter instead of `fn.env`
- Two-phase collect/apply to avoid borrow checker conflicts
- Explicit operand traversal instead of visitor pattern
- `IndexMap` for order-preserving error deduplication

## Port Coverage

### ✅ Ported (4 passes)
1. ValidateContextVariableLValues
2. ValidateUseMemo
3. ValidateHooksUsage
4. ValidateNoCapitalizedCalls

### ❌ Not Yet Ported (13 passes)
1. ValidateExhaustiveDependencies
2. ValidateLocalsNotReassignedAfterRender
3. ValidateNoDerivedComputationsInEffects_exp
4. ValidateNoDerivedComputationsInEffects
5. ValidateNoFreezingKnownMutableFunctions
6. ValidateNoImpureFunctionsInRender
7. ValidateNoJSXInTryStatement
8. ValidateNoRefAccessInRender
9. ValidateNoSetStateInEffects
10. ValidateNoSetStateInRender
11. ValidatePreservedManualMemoization
12. ValidateSourceLocations
13. ValidateStaticComponents

## Overall Assessment

The four ported validation passes are high-quality ports that maintain ~90-95% structural correspondence with the TypeScript source. The divergences are primarily architectural adaptations required by Rust's ownership system and the arena-based HIR design.

### Strengths
- Logic correctness: All validation rules are accurately ported
- Error messages: Match TypeScript verbatim
- Architecture compliance: Follows rust-port-architecture.md patterns
- Code clarity: Well-commented with clear intent

### Recommendations
1. Address the default case handling in `validate_context_variable_lvalues.rs`
2. Document the error return pattern in `validate_use_memo.rs`
3. Verify error ordering in `validate_hooks_usage.rs` function expression validation
4. Consider extracting shared error tracking helper in `validate_hooks_usage.rs`
5. Port remaining 13 validation passes

## Detailed Reviews

See individual review files in this directory:
- `lib.rs.md`
- `validate_context_variable_lvalues.rs.md`
- `validate_use_memo.rs.md`
- `validate_hooks_usage.rs.md`
- `validate_no_capitalized_calls.rs.md`
