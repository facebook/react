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
to the browser:

```js
if (props.tabIndex === -1 || props.disabled) {
  return false;
}
if (props.tabIndex === 0 || props.contentEditable === true) {
  return true;
}
if (type === 'a' || type === 'area') {
  return !!props.href && props.rel !== 'ignore';
}
if (type === 'input') {
  return props.type !== 'hidden' && props.type !== 'file';
}
return (
  type === 'button' ||
  type === 'textarea' ||
  type === 'object' ||
  type === 'select' ||
  type === 'iframe' ||
  type === 'embed'
);
```