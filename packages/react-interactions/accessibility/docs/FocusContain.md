# FocusContain

`FocusContain` is a component that contains user-focusability to only that
of the children of the component. This means focus control will not escape
unless the componoent is disabled (using the `disabled` prop) or unmounted.
Additionally, `FocusContain` can contain tab focus when passed a `ReactScope`
using the `tabFocus` prop.

## Usage

```jsx
import FocusContain from 'react-interactions/accessibility/focus-contain';
import tabbableScopeQuery from 'react-interactions/accessibility/tabbable-scope-query';

function MyDialog(props) {
  return (
    <FocusContain scopeQuery={tabbableScopeQuery} disabled={false}>
      <div>
        <h2>{props.title}<h2>
        <p>{props.text}</p>
        <Button onPress={...}>Accept</Button>
        <Button onPress={...}>Close</Button>
      </div>
    </FocusContain>
  )
}
```
