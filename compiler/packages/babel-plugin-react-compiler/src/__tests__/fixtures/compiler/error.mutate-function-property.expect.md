
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
Found 1 error:
Error: This mutates a variable that React considers immutable

error.mutate-function-property.ts:3:2
  1 | export function ViewModeSelector(props) {
  2 |   const renderIcon = () => <AcceptIcon />;
> 3 |   renderIcon.displayName = 'AcceptIcon';
    |   ^^^^^^^^^^ This mutates a variable that React considers immutable
  4 |
  5 |   return <Dropdown checkableIndicator={{children: renderIcon}} />;
  6 | }


```
          
      