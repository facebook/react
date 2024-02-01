
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
[ReactForget] InvalidReact: This mutates a variable that React considers immutable. (3:3)
```
          
      