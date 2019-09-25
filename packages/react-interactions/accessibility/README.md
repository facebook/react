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

When creating a scope, a query function is required. The query function is used
when collecting host nodes that match the criteria of the query function.

```jsx
// This query function only matches host nodes that have the type of "div"
const queryFunction = (type: string, props: Object): boolean => {
  if (type === 'div') {
    return true;
  }
  return false;
};

// Create the scope with the queryFunction above
const DivOnlyScope = React.unstable_createScope(queryFunction);

// We can now use this in our components. We need to attach
// a ref so we can get the matching host nodes.
function MyComponent(props) {
  const divOnlyScope = useRef(null);
  return (
    <DivOnlyScope ref={divOnlyScope}>
      <div>DIV 1</div>
      <div>DIV 2</div>
      <div>DIV 3</div>
    </DivOnlyScope>
  );
}

// Using the ref, we can get the host nodes via getScopedNodes()
const divs = divOnlyScope.current.getScopedNodes();

// [<div>DIV 1</div>, <div>DIV 2</div>, <div>DIV 3</div>]
console.log(divs);
```

## React Scope Interface

Scopes require a `ref` to access the internal interface of a particular scope.
The internal interface (`ReactScopeInterface`) exposes the following scope API:

### getChildren: () => null | Array<ReactScopeInterface>

Returns an array of all child `ReactScopeInterface` nodes that are
of scopes of the same type. Returns `null` if there are no child scope nodes.

### getChildrenFromRoot: () => null | Array<ReactScopeInterface>

Similar to `getChildren`, except this applies the same traversal from the root of the
React internal tree instead of from the scope node position.

### getParent: () => null | ReactScopeInterface

Returns the parent `ReactScopeInterface` of the scope node or `null` if none exists.

### getProps: () => Object

Returns the current `props` object of the scope node.

### getScopedNodes: () => null | Array<HTMLElement>

Returns an array of all child host nodes that successfully match when queried using the
query function passed to the scope. Returns `null` if there are no matching host nodes.