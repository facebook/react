# TypeScript Migration Guide

This guide helps contributors migrate React packages from Flow to TypeScript.

## Quick Start

1. **Check the tracking issue** to see which packages need migration
2. **Claim a package** by commenting on the issue
3. **Follow the checklist** below
4. **Submit a PR** with your migration

## Migration Checklist

### Preparation
- [ ] Read this guide completely
- [ ] Ensure the package is assigned to you
- [ ] Create a new branch: `git checkout -b migrate-<package-name>-to-typescript`

### Setup
- [ ] Create `tsconfig.json` in the package directory
- [ ] Add TypeScript dependencies if needed
- [ ] Update package.json scripts

### Migration
- [ ] Rename `.js` files to `.ts` (or `.tsx` for JSX)
- [ ] Remove Flow annotations (`// @flow`, type imports)
- [ ] Convert Flow types to TypeScript
- [ ] Fix TypeScript errors
- [ ] Ensure strict mode compliance

### Validation
- [ ] Run `yarn tsc --noEmit` - no errors
- [ ] Run `yarn test <package-name>` - all tests pass
- [ ] Run `yarn build <package-name>` - builds successfully
- [ ] Check type declarations are generated
- [ ] Verify no runtime behavior changes

### Documentation
- [ ] Update package README if needed
- [ ] Document any migration challenges
- [ ] Add comments for complex type conversions

### Submission
- [ ] Create PR with descriptive title
- [ ] Link to tracking issue
- [ ] Fill out PR template completely
- [ ] Request review from TypeScript migration team

## Flow to TypeScript Conversion

### Type Syntax

#### Exact Types
```typescript
// Flow
type Props = {|
  name: string,
  age?: number,
|};

// TypeScript
type Props = {
  readonly name: string;
  readonly age?: number;
};
```

#### Type Imports
```typescript
// Flow
import type {User} from './types';

// TypeScript (two options)
import type {User} from './types';
// OR
import {type User} from './types';
```

#### Generic Constraints
```typescript
// Flow
function foo<T: string>(x: T): T { }

// TypeScript
function foo<T extends string>(x: T): T { }
```

#### Utility Types
```typescript
// Flow: $ReadOnly<T>
// TypeScript: Readonly<T>

// Flow: $Keys<T>
// TypeScript: keyof T

// Flow: $Values<T>
// TypeScript: T[keyof T]

// Flow: $Diff<A, B>
// TypeScript: Omit<A, keyof B>

// Flow: $Rest<A, B>
// TypeScript: Omit<A, keyof B>

// Flow: $Exact<T>
// TypeScript: No direct equivalent, use readonly

// Flow: $Shape<T>
// TypeScript: Partial<T>
```

### Common Patterns

#### React Component Props
```typescript
// Flow
type Props = {|
  children: React.Node,
  onClick: (event: SyntheticEvent<>) => void,
|};

// TypeScript
type Props = {
  children: React.ReactNode;
  onClick: (event: React.SyntheticEvent) => void;
};
```

#### Function Types
```typescript
// Flow
type Callback = (x: number) => string;

// TypeScript (same)
type Callback = (x: number) => string;
```

## Package-Specific tsconfig.json

Create `tsconfig.json` in the package directory:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./build",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["**/__tests__/**", "**/*.spec.ts"]
}
```

## Common Issues

### Issue: `any` types everywhere
**Solution:** Use `unknown` instead, or define proper types

### Issue: Circular dependencies
**Solution:** Use `import type` for type-only imports

### Issue: Complex Flow types
**Solution:** Break down into smaller types, use TypeScript utility types

### Issue: Tests failing
**Solution:** Ensure test files are also migrated, update Jest config

## Getting Help

- **Questions:** Ask in the GitHub discussion
- **Stuck:** Comment on the tracking issue
- **Bugs:** File an issue with `typescript-migration` label

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Flow to TypeScript Guide](https://github.com/bcherny/flow-to-typescript)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Example Migration

See the `react-is` package migration as a reference example.
