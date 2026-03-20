# Review: react_compiler_validation/src/validate_no_capitalized_calls.rs

## Corresponding TypeScript source
- `compiler/packages/babel-plugin-react-compiler/src/Validation/ValidateNoCapitalizedCalls.ts`

## Summary
The Rust port accurately implements validation that capitalized functions are not called directly. Logic is nearly identical to TypeScript with only minor structural differences.

## Major Issues
None.

## Moderate Issues
None.

## Minor Issues

### 1. Different allow list construction (lines 12-17)
**Location:** `validate_no_capitalized_calls.rs:12-17` vs `ValidateNoCapitalizedCalls.ts:14-21`

**Rust:**
```rust
let mut allow_list: HashSet<String> = env.globals().keys().cloned().collect();
if let Some(config_entries) = &env.config.validate_no_capitalized_calls {
    for entry in config_entries {
        allow_list.insert(entry.clone());
    }
}
```

**TypeScript:**
```typescript
const ALLOW_LIST = new Set([
  ...DEFAULT_GLOBALS.keys(),
  ...(envConfig.validateNoCapitalizedCalls ?? []),
]);
const isAllowed = (name: string): boolean => {
  return ALLOW_LIST.has(name);
};
```

**Note:** Rust builds the set imperatively, TypeScript uses spread operators. Functionally equivalent. TypeScript also defines an `isAllowed()` helper which Rust inlines.

### 2. Regex vs starts_with for capitalization check (lines 33-34)
**Location:** `validate_no_capitalized_calls.rs:33-34` vs `ValidateNoCapitalizedCalls.ts:32-35`

**Rust:**
```rust
&& name.starts_with(|c: char| c.is_ascii_uppercase())
// We don't want to flag CONSTANTS()
&& name != name.to_uppercase()
```

**TypeScript:**
```typescript
/^[A-Z]/.test(value.binding.name) &&
// We don't want to flag CONSTANTS()
!(value.binding.name.toUpperCase() === value.binding.name) &&
```

**Note:** Rust uses `starts_with` + predicate, TypeScript uses regex. Both check for uppercase start and exclude all-caps names. Functionally equivalent.

### 3. PropertyLiteral matching (lines 56-61)
**Location:** `validate_no_capitalized_calls.rs:56-61` vs `ValidateNoCapitalizedCalls.ts:62-67`

**Rust:**
```rust
if let PropertyLiteral::String(prop_name) = property {
    if prop_name.starts_with(|c: char| c.is_ascii_uppercase()) {
        capitalized_properties.insert(lvalue_id, prop_name.clone());
    }
}
```

**TypeScript:**
```typescript
if (
  typeof value.property === 'string' &&
  /^[A-Z]/.test(value.property)
) {
  capitalizedProperties.set(lvalue.identifier.id, value.property);
}
```

**Note:** Rust matches on the `PropertyLiteral` enum, TypeScript uses `typeof`. The Rust version doesn't check for Number properties, but that's correct since we only care about capitalized strings.

## Architectural Differences

### 1. Global registry access (line 12)
**Rust:** `env.globals().keys()`
**TypeScript:** `DEFAULT_GLOBALS.keys()`

**Reason:** Rust accesses globals through the Environment's method, TypeScript imports the constant directly.

### 2. Config access (line 13)
**Rust:** `env.config.validate_no_capitalized_calls`
**TypeScript:** `envConfig.validateNoCapitalizedCalls`

**Reason:** Rust naming convention uses snake_case, TypeScript uses camelCase.

### 3. PropertyLiteral enum (line 56)
**Rust:** Pattern matches on `PropertyLiteral::String` vs `PropertyLiteral::Number`
**TypeScript:** Uses `typeof value.property === 'string'`

**Reason:** Rust's HIR uses an enum for property literals, TypeScript uses a union type.

## Missing from Rust Port
None - all TypeScript logic is present.

## Additional in Rust Port
None - the Rust version is a faithful port with no additional logic.
