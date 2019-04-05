# `react-events`

*This package is experimental. It is intended for use with the experimental React
events API that is not available in open source builds.*


## Focus

The `Focus` module responds to focus and blur events on the element it wraps.
Focus events are dispatched for `mouse`, `pen`, `touch`, and `keyboard`
pointer types.

```
type FocusEvent = {}
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


## Hover

The `Hover` module responds to hover events on the element it wraps. Hover
events are only dispatched for `mouse` pointer types. Hover begins when the
pointer enters the element's bounds and ends when the pointer leaves.

```
type HoverEvent = {}
```

### disabled: boolean

Disables all `Hover` events.

### onHoverStart: (e: HoverEvent) => void

Called once the element is hovered. It will not be called if the pointer leaves
the element before the `delayHoverStart` threshold is exceeded. And it will not
be called more than once before `onHoverEnd` is called.

### onHoverEnd: (e: HoverEvent) => void

Called once the element is no longer hovered. It will be cancelled if the
pointer leaves the element before the `delayHoverStart` threshold is exceeded.

### onHoverChange: boolean => void

Called when the element changes hover state (i.e., after `onHoverStart` and
`onHoverEnd`).

### delayHoverStart: number

The duration of the delay between when hover starts and when `onHoverStart` is
called.

### delayHoverEnd: number

The duration of the delay between when hover ends and when `onHoverEnd` is
called.


## Press

The `Press` module responds to press events on the element it wraps. Press
events are dispatched for `mouse`, `pen`, `touch`, and `keyboard` pointer types.

```
type PressEvent = {}
```

### disabled: boolean

Disables all `Press` events.

### onPressStart: (e: PressEvent) => void

Called once the element is pressed down. If the press is released before the
`delayPressStart` threshold is exceeded then the delay is cut short and
`onPressStart` is called immediately.

### onPressEnd: (e: PressEvent) => void

Called once the element is no longer pressed. It will be cancelled if the press
starts again before the `delayPressEnd` threshold is exceeded.

### onPressChange: boolean => void

Called when the element changes press state (i.e., after `onPressStart` and
`onPressEnd`).

### onLongPress: (e: PressEvent) => void

Called once the element has been pressed for the length of `delayLongPress`.

### onLongPressChange: boolean => void

Called when the element changes long-press state.

### onLongPressShouldCancelPress: () => boolean

Determines whether calling `onPress` should be cancelled if `onLongPress` or
`onLongPressChange` have already been called. Default is `false`.

### onPress: (e: PressEvent) => void

Called after `onPressEnd` only if `onLongPressShouldCancelPress` returns
`false`.

### delayPressStart: number

The duration of a delay between when the press starts and when `onPressStart` is
called. This delay is cut short if the press ends released before the threshold
is exceeded.

### delayPressEnd: number

The duration of the delay between when the press ends and when `onPressEnd` is
called.

### delayLongPress: number = 500ms

The duration of a press before `onLongPress` and `onLongPressChange` are called.

### pressRententionOffset: { top: number, right: number, bottom: number, right: number }

Defines how far the pointer (while held down) may move outside the bounds of the
element before it is deactivated. Once deactivated, the pointer (still held
down) can be moved back within the bounds of the element to reactivate it.
Ensure you pass in a constant to reduce memory allocations.
