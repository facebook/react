# FocusManager

`FocusManager` is a component that is designed to provide basic focus management
control. These are the various props that `FocusManager` accepts:

## Usage

```jsx
function MyDialog(props) {
  return (
    <FocusManager containFocus={true} autoFocus={true}>
      <div>
        <h2>{props.title}<h2>
        <p>{props.text}</p>
        <Button onPress={...}>Accept</Button>
        <Button onPress={...}>Close</Button>
      </div>
    </FocusManager>
  )
}
```

### `scope`
`FocusManager` accepts a custom `ReactScope`. If a custom one is not supplied, `FocusManager`
will default to using `TabbableScope`.

### `autoFocus`
When enabled, the first host node that matches the `FocusManager` scope will be focused
upon the `FocusManager` mounting.

### `restoreFocus`
When enabled, the previous host node that was focused as `FocusManager` is mounted,
has its focus restored upon `FocusManager` unmounting.

### `containFocus`
This contains the user focus to only that of `FocusManager`s sub-tree. Tabbing or
interacting with nodes outside the sub-tree will restore focus back into the `FocusManager`.
This is useful for modals, dialogs, dropdowns and other UI elements that require
a form of user-focus control that is similar to the `inert` property on the web.