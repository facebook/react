## Focus

The `Focus` module responds to focus and blur events on its child. Focus events
are dispatched for `mouse`, `pen`, `touch`, and `keyboard`
pointer types.

Focus events do not propagate between `Focus` event responders.

```js
// Example
const TextField = (props) => (
  <Focus
    onBlur={props.onBlur}
    onFocus={props.onFocus}
  >
    <textarea></textarea>
  </Focus>
);
```

```js
// Types
type FocusEvent = {
  target: Element,
  type: 'blur' | 'focus' | 'focuschange'
}
```

### disabled: boolean

Disables all `Focus` events.

### onBlur: (e: FocusEvent) => void

Called when the element loses focus.

### onFocus: (e: FocusEvent) => void

Called when the element gains focus.

### onFocusChange: boolean => void

Called when the element changes hover state (i.e., after `onBlur` and
`onFocus`).
