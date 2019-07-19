# FocusWithin

The `FocusWithin` module responds to focus and blur events on its child. Focus events
are dispatched for all input types, with the exception of `onFocusVisibleChange`
which is only dispatched when focusing with a keyboard.

Focus events do not propagate between `FocusWithin` event responders.

```js
// Example
const Button = (props) => {
  const [ focusWithin, updateFocusWithin ] = useState(false);
  const [ focusWithinVisible, updateFocusWithinVisible ] = useState(false);

  return (
    <FocusWithin
      onFocusWithinChange={updateFocusWithin}
      onFocusWithinVisibleChange={updateFocusWithinVisible}
    >
      <button
        children={props.children}
        style={{
          ...(focusWithin && focusWithinStyles),
          ...(focusWithinVisible && focusWithinVisibleStyles)
        }}
      >
    </FocusWithin>
  );
};
```

## Types

```js
type FocusEvent = {
  target: Element,
  type: 'focuswithinchange' | 'focuswithinvisiblechange'
}
```

## Props

### disabled: boolean = false

Disables all `FocusWithin` events.

### onFocusWithinChange: boolean => void

Called once the element or a descendant receives focus, and once focus moves
outside of the element.

### onFocusWithinVisibleChange: boolean => void

Called once the element or a descendant is focused following keyboard
navigation, and once focus moves outside of the element. This can be used to
display focus styles only when the keyboard is being used to focus within the
element's subtree.
