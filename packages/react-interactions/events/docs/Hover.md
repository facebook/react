# Hover

The `useHover` hook responds to hover events on the element it wraps. Hover
events are only dispatched for `mouse` and `pen` pointer types. Hover begins
when the pointer enters the element's bounds and ends when the pointer leaves.

Hover events do not propagate between `useHover` event responders.

```js
// Example
const Link = (props) => (
  const [ isHovered, setHovered ] = useState(false);
  const hover = useHover({
    onHoverChange: setHovered
  });

  return (
    <a
      {...props}
      href={props.href}
      DEPRECATED_flareListeners={hover}
      style={{
        ...props.style,
        textDecoration: isHovered ? 'underline': 'none'
      }}
    />
  );
);
```

## Types

```js
type HoverEventType = 'hoverstart' | 'hoverend' | 'hoverchange' | 'hovermove';

type HoverEvent = {|
  clientX: number,
  clientY: number,
  pageX: number,
  pageY: number,
  pointerType: PointerType,
  target: Element,
  timeStamp: number,
  type: HoverEventType,
  x: number,
  y: number,
|};
```

## Props

### disabled: boolean

Disables the responder.

### onHoverChange: boolean => void

Called when the element changes hover state (i.e., after `onHoverStart` and
`onHoverEnd`).

### onHoverEnd: (e: HoverEvent) => void

Called once the element is no longer hovered.

### onHoverMove: (e: HoverEvent) => void

Called when the pointer moves within the hit bounds of the element.

### onHoverStart: (e: HoverEvent) => void

Called once the element is hovered.

### preventDefault: boolean = true

Whether to `preventDefault()` native events.
