# FocusScope

The `FocusScope` module can be used to manage focus within its subtree.

```js
// Example
const Modal = () => (
  <FocusScope
    autoFocus={true}     
    contain={true}
    restoreFocus={true}
  >
    <h1>Focus contained within modal</h1>
    <input placeholder="Focusable input" />
    <div role="button" tabIndex={0}>Focusable element</div>
    <input placeholder="Non-focusable input" tabIndex={-1} />
    <Press onPress={onPressClose}>
      <div role="button" tabIndex={0}>Close</div>
    </Press>
  </FocusScope>
);
```

## Props

### autoFocus: boolean = false

Automatically moves focus to the first focusable element within scope.

### contain: boolean = false

Contain focus within the subtree of the `FocusScope` instance.

### restoreFocus: boolean = false

Automatically restores focus to element that was last focused before focus moved
within the scope.
