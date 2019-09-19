# Focus

The `useFocus` hook responds to focus and blur events on its child. Focus events
are dispatched for all input types, with the exception of `onFocusVisibleChange`
which is only dispatched when focusing with a keyboard.

Focus events do not propagate between `useFocus` event responders.

```js
// Example
const Button = (props) => {
  const [ isFocusVisible, setFocusVisible ] = useState(false);
  const focus = useFocus({
    onBlur={props.onBlur}
    onFocus={props.onFocus}
    onFocusVisibleChange={setFocusVisible}
  });

  return (
    <button
      children={props.children}
      listeners={focus}
      style={{
        ...(isFocusVisible && focusVisibleStyles)
      }}
    >
  );
};
```

## Types

```js
type FocusEvent = {
  target: Element,
  pointerType: 'mouse' | 'touch' | 'pen' | 'keyboard',
  timeStamp: number,
  type: 'blur' | 'focus' | 'focuschange' | 'focusvisiblechange'
}
```

## Props

### disabled: boolean = false

Disables the responder.

### onBlur: (e: FocusEvent) => void

Called when the element loses focus.

### onFocus: (e: FocusEvent) => void

Called when the element gains focus.

### onFocusChange: boolean => void

Called when the element changes focus state (i.e., after `onBlur` and
`onFocus`).

### onFocusVisibleChange: boolean => void

Called when the element receives or loses focus following keyboard navigation.
This can be used to display focus styles only for keyboard interactions.
