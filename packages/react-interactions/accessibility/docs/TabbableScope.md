# TabbableScope

`TabbableScope` is a custom scope implementation that can be used with
`FocusManager`, `FocusList`, `FocusTable` and `FocusControl` modules.

## Usage

```jsx
function FocusableNodeCollector(props) {
  const scopeRef = useRef(null);

  useEffect(() => {
    const scope = scopeRef.current;

    if (scope) {
      const tabFocusableNodes = scope.getScopedNodes();
      if (tabFocusableNodes && props.onFocusableNodes) {
        props.onFocusableNodes(tabFocusableNodes);
      }
    }
  });
  
  return (
    <TabbableScope ref={scopeRef}>
      {props.children}
    </TabbableScope>
  );
}
```

## Implementation

`TabbableScope` uses the experimental `React.unstable_createScope` API. The query
function used for the scope is designed to collect DOM nodes that are tab focusable
to the browser. See the [implementation](../src/TabbableScope.js#L12-L33) here.
