# Review: react_compiler_inference/src/flatten_scopes_with_hooks_or_use_hir.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/FlattenScopesWithHooksOrUseHIR.ts`

## Summary
The Rust port correctly implements the flattening of scopes containing hook or `use()` calls. The logic matches the TypeScript source with appropriate adaptations for Rust's type system.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Hook/use detection logic
**Location:** Rust lines 52-69 vs TS lines 47-62

**TypeScript:**
```typescript
for (const instr of block.instructions) {
  const {value} = instr;
  switch (value.kind) {
    case 'MethodCall':
    case 'CallExpression': {
      const callee =
        value.kind === 'MethodCall' ? value.property : value.callee;
      if (
        getHookKind(fn.env, callee.identifier) != null ||
        isUseOperator(callee.identifier)
      ) {
        prune.push(...activeScopes.map(entry => entry.block));
        activeScopes.length = 0;
      }
    }
  }
}
```

**Rust:**
```rust
for instr_id in &block.instructions {
    let instr = &func.instructions[instr_id.0 as usize];
    match &instr.value {
        InstructionValue::CallExpression { callee, .. } => {
            let callee_ty = &env.types
                [env.identifiers[callee.identifier.0 as usize].type_.0 as usize];
            if is_hook_or_use(env, callee_ty) {
                // All active scopes must be pruned
                prune.extend(active_scopes.iter().map(|s| s.block));
                active_scopes.clear();
            }
        }
        InstructionValue::MethodCall { property, .. } => {
            let property_ty = &env.types
                [env.identifiers[property.identifier.0 as usize].type_.0 as usize];
            if is_hook_or_use(env, property_ty) {
                prune.extend(active_scopes.iter().map(|s| s.block));
                active_scopes.clear();
            }
        }
        _ => {}
    }
}
```

**Difference:**
1. TypeScript checks both CallExpression and MethodCall in a single case with a ternary to select the callee. Rust has separate match arms.
2. TypeScript calls `getHookKind(fn.env, callee.identifier)` and `isUseOperator(callee.identifier)`. Rust looks up the identifier's type and calls `is_hook_or_use(env, callee_ty)`.

**Impact:** Both approaches check if the callee/property is a hook or use operator. The Rust version works with types rather than identifiers, consistent with the Rust architecture.

### 2. Helper function structure
**Location:** Rust lines 139-149 vs TS lines 14-16

**TypeScript:**
```typescript
import {
  BlockId,
  HIRFunction,
  LabelTerminal,
  PrunedScopeTerminal,
  getHookKind,
  isUseOperator,
} from '../HIR';
```

**Rust:**
```rust
fn is_hook_or_use(env: &Environment, ty: &Type) -> bool {
    env.get_hook_kind_for_type(ty).is_some() || is_use_operator_type(ty)
}

fn is_use_operator_type(ty: &Type) -> bool {
    matches!(
        ty,
        Type::Function { shape_id: Some(id), .. }
            if id == react_compiler_hir::object_shape::BUILT_IN_USE_OPERATOR_ID
    )
}
```

**Difference:**
- TypeScript imports `getHookKind` and `isUseOperator` from HIR module
- Rust implements `is_hook_or_use()` and `is_use_operator_type()` inline

**Impact:** Same logic, just different module organization.

### 3. Scope terminal pruning logic
**Location:** Rust lines 86-131 vs TS lines 72-109

**TypeScript:**
```typescript
for (const id of prune) {
  const block = fn.body.blocks.get(id)!;
  const terminal = block.terminal;
  CompilerError.invariant(terminal.kind === 'scope', {
    reason: `Expected block to have a scope terminal`,
    description: `Expected block bb${block.id} to end in a scope terminal`,
    loc: terminal.loc,
  });
  const body = fn.body.blocks.get(terminal.block)!;
  if (
    body.instructions.length === 1 &&
    body.terminal.kind === 'goto' &&
    body.terminal.block === terminal.fallthrough
  ) {
    block.terminal = {
      kind: 'label',
      block: terminal.block,
      fallthrough: terminal.fallthrough,
      id: terminal.id,
      loc: terminal.loc,
    } as LabelTerminal;
    continue;
  }

  block.terminal = {
    kind: 'pruned-scope',
    block: terminal.block,
    fallthrough: terminal.fallthrough,
    id: terminal.id,
    loc: terminal.loc,
    scope: terminal.scope,
  } as PrunedScopeTerminal;
}
```

**Rust:**
```rust
for id in prune {
    let block = &func.body.blocks[&id];
    let terminal = &block.terminal;

    let (scope_block, fallthrough, eval_id, loc, scope) = match terminal {
        Terminal::Scope {
            block,
            fallthrough,
            id,
            loc,
            scope,
        } => (*block, *fallthrough, *id, *loc, *scope),
        _ => panic!(
            "Expected block bb{} to end in a scope terminal",
            id.0
        ),
    };

    // Check if the scope body is a single-instruction block that goes directly
    // to fallthrough — if so, use Label instead of PrunedScope
    let body = &func.body.blocks[&scope_block];
    let new_terminal = if body.instructions.len() == 1
        && matches!(&body.terminal, Terminal::Goto { block, .. } if *block == fallthrough)
    {
        Terminal::Label {
            block: scope_block,
            fallthrough,
            id: eval_id,
            loc,
        }
    } else {
        Terminal::PrunedScope {
            block: scope_block,
            fallthrough,
            scope,
            id: eval_id,
            loc,
        }
    };

    let block_mut = func.body.blocks.get_mut(&id).unwrap();
    block_mut.terminal = new_terminal;
}
```

**Difference:**
1. TypeScript uses `CompilerError.invariant()` for runtime checking, Rust uses `panic!()` (which is reasonable since this is an internal invariant)
2. Rust destructures the Scope terminal in a match, TypeScript just asserts the kind
3. Rust uses `matches!()` macro for the goto check, TypeScript uses property access

**Impact:** Identical logic, different error handling (Rust panics vs TypeScript throws CompilerError.invariant).

## Architectural Differences

### 1. Hook/use detection
- **TypeScript:** `getHookKind(fn.env, callee.identifier)` checks identifier
- **Rust:** `env.get_hook_kind_for_type(ty)` checks type

### 2. Error handling
- **TypeScript:** Uses `CompilerError.invariant()` with structured error info
- **Rust:** Uses `panic!()` for internal invariants (line 99-102)

This is reasonable since encountering a non-scope terminal here indicates an internal compiler bug, not a user error.

### 3. Mutation pattern
- **TypeScript:** Directly assigns to `block.terminal`
- **Rust:** Must drop immutable borrow, then get mutable reference (line 129)

## Missing from Rust Port
None. All logic is correctly implemented.

## Additional in Rust Port

### 1. Inline helper functions
The `is_hook_or_use()` and `is_use_operator_type()` functions (lines 139-149) are implemented inline rather than imported, consistent with other Rust passes.
