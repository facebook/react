# ContextMenu

The `useContextMenu` hooks responds to context-menu events.

```js
// Example
const Button = (props) => {
  const contextmenu = useContextMenu({
    disabled,
    onContextMenu,
    preventDefault
  });

  return (
    <div listeners={contextmenu}>
      {props.children}
    </div>
  );
};
```

## Types

```js
type ContextMenuEvent = {
  altKey: boolean,
  buttons: 0 | 1 | 2,
  ctrlKey: boolean,
  metaKey: boolean,
  pageX: number,
  pageY: number,
  pointerType: PointerType,
  shiftKey: boolean,
  target: Element,
  timeStamp: number,
  type: 'contextmenu',
  x: number,
  y: number,
}
```

## Props

### disabled: boolean = false

Disables the responder.

### onContextMenu: (e: ContextMenuEvent) => void

Called when the user performs a gesture to display a context menu.

### preventDefault: boolean = true

Prevents the native behavior (i.e., context menu).
