
## Input

```javascript
export function ViewModeSelector(props) {
  const renderIcon = () => <AcceptIcon />;
  renderIcon.displayName = "AcceptIcon";

  return <Dropdown checkableIndicator={{ children: renderIcon }} />;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a global or a variable after it was passed to React, which means that React cannot observe changes to it. (3:3)
```
          
      