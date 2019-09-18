# Press

The `usePress` hook responds to press events on the element it wraps. Press
events are dispatched for `mouse`, `pen`, `touch`, `trackpad`, and `keyboard`
pointer types. Press events are only dispatched for keyboards when pressing the
Enter or Spacebar keys. If `onPress` is not called, this signifies that the
press ended outside of the element hit bounds (i.e., the user aborted the
press).

Press events do not propagate between `usePress` event responders.

```js
// Example
const Button = (props) => (
  const [ isPressed, setPressed ] = useState(false);
  const press = usePress({
    onPress={props.onPress}
    onPressChange={setPressed}
  });

  return (
    <div
      {...props}
      listeners={press}
      role="button"
      tabIndex={0}
      style={
        ...buttonStyles,
        ...(isPressed && pressedStyles)
      }}
    />
  );
);
```

## Types

```js
type PressEvent = {
  altKey: boolean,
  buttons: 0 | 1 | 4,
  ctrlKey: boolean,
  defaultPrevented: boolean,
  metaKey: boolean,
  pageX: number,
  pageY: number,
  pointerType:
    | 'mouse'
    | 'touch'
    | 'pen'
    | 'trackpad'
    | 'keyboard',
  screenX: number,
  screenY: number,
  shiftKey: boolean,
  target: Element,
  timeStamp: number,
  type:
    | 'press'
    | 'pressstart'
    | 'pressend'
    | 'presschange'
    | 'pressmove'
    | 'contextmenu',
  x: number,
  y: number
}

type PressOffset = {
  top?: number,
  right?: number,
  bottom?: number,
  right?: number
};
```

## Props

### disabled: boolean = false

Disables the responder.

### onPress: (e: PressEvent) => void

Called immediately after a press is released, unless the press is released
outside the hit bounds of the element (accounting for `pressRetentionOffset`.

### onPressChange: boolean => void

Called when the element changes press state (i.e., after `onPressStart` and
`onPressEnd`).

### onPressEnd: (e: PressEvent) => void

Called once the element is no longer pressed (because the press was released,
cancelled, or moved beyond the hit bounds).

### onPressMove: (e: PressEvent) => void

Called when a press moves within the hit bounds of the element. Never called for
keyboard-initiated press events.  

### onPressStart: (e: PressEvent) => void

Called once the element is pressed down.

### pressRetentionOffset: PressOffset

Defines how far the pointer (while held down) may move outside the bounds of the
element before it is deactivated. Once deactivated, the pointer (still held
down) can be moved back within the bounds of the element to reactivate it.
Ensure you pass in a constant to reduce memory allocations. Default is `20` for
each offset.

### preventDefault: boolean = true

Whether to `preventDefault()` native events. Native behavior is prevented by
default. If an anchor is the child of `Press`, internal and external navigation
should be performed in `onPress`. To rely on native behavior instead, set
`preventDefault` to `false`, but be aware that native behavior will take place
immediately after interaction.
