# FocusManager

`FocusManager` is a module that exports a selection of helpful utility functions to be used
in conjunction with the `ref` from a React Scope, such as `TabbableScope`.

## Example

```jsx
import {
  focusFirst,
  focusNext,
  focusPrevious,
  getNextScope,
  getPreviousScope,
} from 'react-interactions/accessibility/focus-manager';

function scopeQuery(type) {
  return type === 'div';
}

function KeyboardFocusMover(props) {
  const scopeRef = useRef(null);

  useEffect(() => {
    const scope = scopeRef.current;

    if (scope) {
      // Focus the first tabbable DOM node in my children
      focusFirst(scopeQuery, scope);
      // Then focus the next chilkd
      focusNext(scopeQuery, scope);
    }
  });
  
  return (
    <TabbableScope ref={scopeRef}>
      {props.children}
    </TabbableScope>
  );
}
```

## FocusManager API

### `focusFirst`

Focus the first node that matches the given scope.

### `focusNext`

Focus the next sequential node that matches the given scope.

### `focusPrevious`

Focus the previous sequential node that matches the given scope.

### `getNextScope`

Focus the first node that matches the next sibling scope from the given scope.

### `getPreviousScope`

Focus the first node that matches the previous sibling scope from the given scope.
