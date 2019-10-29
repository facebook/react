# TabbableScopeQuery

`TabbableScopeQuery` is a custom scope implementation that can be used with
`FocusContain`, `FocusGroup`, `FocusTable` and `FocusManager` modules.

## Usage

```jsx
import tabbableScopeQuery from 'react-interactions/accessibility/tabbable-scope-query';

function FocusableNodeCollector(props) {
  const scopeRef = useRef(null);

  useEffect(() => {
    const scope = scopeRef.current;

    if (scope) {
      const tabFocusableNodes = scope.queryAllNodes(tabbableScopeQuery);
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
