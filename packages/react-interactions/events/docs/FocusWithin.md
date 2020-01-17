# FocusWithin

The `useFocusWithin` hooks responds to focus and blur events on its child. Focus events
are dispatched for all input types, with the exception of `onFocusVisibleChange`
which is only dispatched when focusing with a keyboard.

Focus events do not propagate between `useFocusWithin` event responders.

```js
// Example
const Button = (props) => {
  const [ isFocusWithin, updateFocusWithin ] = useState(false);
  const [ isFocusWithinVisible, updateFocusWithinVisible ] = useState(false);
  const focusWithin = useFocusWithin({
    onFocusWithinChange={updateFocusWithin}
    onFocusWithinVisibleChange={updateFocusWithinVisible}
  });

  return (
    <button
      children={props.children}
      DEPRECATED_flareListeners={focusWithin}
      style={{
        ...(isFocusWithin && focusWithinStyles),
        ...(isFocusWithinVisible && focusWithinVisibleStyles)
      }}
    >
  );
};
```

## Props

### disabled: boolean = false

Disables the responder.

### onFocusWithinChange: boolean => void

Called once the element or a descendant receives focus, and once focus moves
outside of the element.

### onFocusWithinVisibleChange: boolean => void

Called once the element or a descendant is focused following keyboard
navigation, and once focus moves outside of the element. This can be used to
display focus styles only when the keyboard is being used to focus within the
element's subtree.
