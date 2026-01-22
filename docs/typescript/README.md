# TypeScript Adoption for React

This directory contains resources and documentation for the ongoing TypeScript migration effort in the React repository.

## Status

🚧 **In Progress** - We are gradually migrating React from Flow to TypeScript.

### Migration Progress

| Package | Status | Notes |
|---------|--------|-------|
| eslint-plugin-react-hooks | ✅ Complete | Already TypeScript |
| react-is | 🔄 In Progress | Pilot package |
| use-subscription | ⏳ Planned | Next in queue |
| use-sync-external-store | ⏳ Planned | |
| *Other packages* | ⏳ Planned | See strategy doc |

## Quick Links

- **[Migration Strategy](../../../brain/implementation_plan.md)** - Comprehensive plan and approach
- **[Contributor Guide](../../docs/contributing/typescript-migration.md)** - How to help migrate packages
- **[Tracking Issue](#)** - Central tracking issue (to be created)

## For Contributors

Want to help with the TypeScript migration? Here's how:

### 1. Choose a Package

Check the [tracking issue](#) for available packages. Good starter packages:
- `react-is` (pilot - in progress)
- `use-subscription`
- `use-sync-external-store`

### 2. Use the Migration Script

```bash
# Run the migration helper
node scripts/typescript/migrate-package.js <package-name>

# This creates:
# - tsconfig.json for the package
# - files-to-rename.txt listing files to convert
# - MIGRATION_CHECKLIST.md with step-by-step guide
```

### 3. Follow the Guide

See [typescript-migration.md](../../docs/contributing/typescript-migration.md) for:
- Flow to TypeScript conversion patterns
- Common issues and solutions
- Validation steps
- PR submission guidelines

### 4. Submit a PR

- Link to the tracking issue
- Follow the migration checklist
- Request review from the TypeScript migration team

## Tools & Scripts

### `scripts/typescript/migrate-package.js`

Automates initial setup for migrating a package:
- Creates tsconfig.json
- Lists files to rename
- Generates migration checklist

Usage:
```bash
node scripts/typescript/migrate-package.js react-is
```

### `tsconfig.base.json`

Root TypeScript configuration with:
- Strict type checking enabled
- Monorepo path mappings
- Shared compiler options

## Migration Philosophy

1. **Incremental** - One package at a time
2. **No Breaking Changes** - Maintain API compatibility
3. **Well-Tested** - All tests must pass
4. **Documented** - Learn and share knowledge
5. **Community-Driven** - Open to all contributors

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Flow to TypeScript](https://github.com/bcherny/flow-to-typescript)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Questions?

- **General questions**: Comment on the tracking issue
- **Package-specific**: Create a discussion
- **Bugs**: File an issue with `typescript-migration` label

---

**Last Updated:** 2026-01-22  
**Maintained by:** React Core Team + Community Contributors
