# Review: react_compiler_inference/src/merge_overlapping_reactive_scopes_hir.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/HIR/MergeOverlappingReactiveScopesHIR.ts`

## Summary
The Rust port correctly implements the merging of overlapping reactive scopes. The core algorithm matches the TypeScript source. The main architectural difference is the explicit handling of shared mutable_range references in Rust (lines 400-436).

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Switch case ordering in MergeOverlappingReactiveScopesHIR.ts
**Location:** TS lines 290-304 vs Rust lines 342-354

**TypeScript:**
```typescript
for (const place of eachInstructionOperand(instr)) {
  if (
    (instr.value.kind === 'FunctionExpression' ||
      instr.value.kind === 'ObjectMethod') &&
    place.identifier.type.kind === 'Primitive'
  ) {
    continue;
  }
  visitPlace(instr.id, place, state);
}
```

**Rust:**
```rust
let is_func_or_method = matches!(
    &instr.value,
    InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. }
);
let operand_ids = each_instruction_operand_ids_with_types(instr, env);
for (op_id, type_) in &operand_ids {
    if is_func_or_method && matches!(type_, Type::Primitive) {
        continue;
    }
    visit_place(instr.id, *op_id, &mut state, env);
}
```

**Impact:** Both implementations skip Primitive-typed operands of FunctionExpression/ObjectMethod. The logic is identical, just structured differently.

### 2. Terminal case operands in Switch
**Location:** Rust lines 761-771 vs TS (not shown, within `eachTerminalOperand`)

**Rust includes switch case tests:**
```rust
Terminal::Switch { test, cases, .. } => {
    let mut ids = vec![test.identifier];
    for case in cases {
        if let Some(ref case_test) = case.test {
            ids.push(case_test.identifier);
        }
    }
    ids
}
```

**TypeScript:** The `eachTerminalOperand` visitor in TypeScript also handles switch case tests (not shown in the file, but referenced).

**Impact:** Correct implementation.

## Architectural Differences

### 1. Shared mutable_range references
**Location:** Lines 400-436

**Critical difference:** In TypeScript, `identifier.mutableRange` and `scope.range` share the same object reference. When a scope is merged and its range is updated, ALL identifiers (even those whose scope was later set to null) automatically see the updated range.

**Rust implementation (lines 400-436):**
```rust
// Collect root scopes' ORIGINAL ranges BEFORE updating them.
// In TS, identifier.mutableRange shares the same object reference as scope.range.
// When scope.range is updated, ALL identifiers referencing that range object
// automatically see the new values — even identifiers whose scope was later set to null.
// In Rust, we must explicitly find and update identifiers whose mutable_range matches
// a root scope's original range.
let mut original_root_ranges: HashMap<ScopeId, (EvaluationOrder, EvaluationOrder)> = HashMap::new();
for (_, root_id) in &scope_groups {
    if !original_root_ranges.contains_key(root_id) {
        let range = &env.scopes[root_id.0 as usize].range;
        original_root_ranges.insert(*root_id, (range.start, range.end));
    }
}

// Update root scope ranges
for (scope_id, root_id) in &scope_groups {
    let scope_start = env.scopes[scope_id.0 as usize].range.start;
    let scope_end = env.scopes[scope_id.0 as usize].range.end;
    let root_range = &mut env.scopes[root_id.0 as usize].range;
    root_range.start = EvaluationOrder(cmp::min(root_range.start.0, scope_start.0));
    root_range.end = EvaluationOrder(cmp::max(root_range.end.0, scope_end.0));
}

// Sync mutable_range for ALL identifiers whose mutable_range matches the ORIGINAL
// range of a root scope that was updated.
for ident in &mut env.identifiers {
    for (root_id, (orig_start, orig_end)) in &original_root_ranges {
        if ident.mutable_range.start == *orig_start && ident.mutable_range.end == *orig_end {
            let new_range = &env.scopes[root_id.0 as usize].range;
            ident.mutable_range.start = new_range.start;
            ident.mutable_range.end = new_range.end;
            break;
        }
    }
}
```

This complex logic emulates the TypeScript behavior where updating a scope's range automatically propagates to all identifiers that reference that range object.

### 2. Place cloning
- **TypeScript:** `eachInstructionOperand` yields `Place` references
- **Rust:** `each_instruction_value_operand_places` returns cloned Places (line 539-750)

### 3. Scope repointing comment
**Location:** Lines 438-447

**Rust comment:**
```rust
// Rewrite all references: for each place that had a scope, point to the merged root.
// Note: we intentionally do NOT update mutable_range for repointed identifiers,
// matching TS behavior where identifier.mutableRange still references the old scope's
// range object after scope repointing.
```

This explicitly documents the subtle TypeScript behavior that repointing `identifier.scope` does NOT change `identifier.mutableRange` because they point to different objects.

## Missing from Rust Port
None. All logic is correctly implemented.

## Additional in Rust Port

### 1. Explicit mutable_range synchronization
**Location:** Lines 400-436

The complex logic to emulate TypeScript's shared mutable_range references. This is necessary and correct.

### 2. Helper functions
**Location:** Lines 454-772

Rust duplicates visitor helpers inline (`each_instruction_lvalue_ids`, `each_instruction_operand_ids_with_types`, `each_instruction_value_operand_places`, `each_terminal_operand_ids`) rather than importing from a shared module. This is consistent with other passes in the Rust port.
