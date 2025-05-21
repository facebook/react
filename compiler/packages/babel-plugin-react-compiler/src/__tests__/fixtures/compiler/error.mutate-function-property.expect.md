
## Input

```javascript
export function ViewModeSelector(props) {
  const renderIcon = () => <AcceptIcon />;
  renderIcon.displayName = 'AcceptIcon';

  return <Dropdown checkableIndicator={{children: renderIcon}} />;
}

```


## Error

```
  1 | export function ViewModeSelector(props) {
  2 |   const renderIcon = () => <AcceptIcon />;
> 3 |   renderIcon.displayName = 'AcceptIcon';
    |   ^^^^^^^^^^ InvalidReact: This mutates a variable that React considers immutable (3:3)
  4 |
  5 |   return <Dropdown checkableIndicator={{children: renderIcon}} />;
  6 | }
```
          
      