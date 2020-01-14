# `react-interactions/accessibility`

*This package is experimental. It is intended for use with the experimental React
Scope API that is not available in open source builds.*

Scopes allow for querying of the internal React sub-tree to collect handles to
host nodes. Scopes also have their own separate tree structure that allows
traversal of scopes of the same type.

The core API is documented below. Documentation for individual Accessibility Components
can be found [here](./docs).

## React Scopes

Note: React Scopes require the internal React flag `enableScopeAPI`.

## React Scope Interface

Scopes require a `ref` to access the internal interface of a particular scope.
The internal interface (`ReactScopeInterface`) exposes the following scope API:

### containsNode: (node: HTMLElement) => boolean

Returns `true` or `false` depending on if the given `HTMLElement` is a descendant
of the scope's sub-tree.