# Focus

The `Focus` module responds to focus and blur events on its child. Focus events
are dispatched for all input types, with the exception of `onFocusVisibleChange`
which is only dispatched when focusing with a keyboard.

Focus events do not propagate between `Focus` event responders.

```js
// Example
const Button = (props) => {
  const [ focusVisible, setFocusVisible ] = useState(false);

  return (
    <Focus
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      onFocusVisibleChange={setFocusVisible}
    >
      <button
        children={props.children}
        style={{
          ...(focusVisible && focusVisibleStyles)
        }}
      >
    </Focus>
  );
};
```

## Types

```js
type FocusEvent = {
  target: Element,
  type: 'blur' | 'focus' | 'focuschange' | 'focusvisiblechange'
}
```

## Props

### disabled: boolean = false

Disables all `Focus` events.

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
