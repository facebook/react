
## Input

```javascript
function Component(props) {
  const fbt = require('fbt');

  return <fbt desc="Description">{'Text'}</fbt>;
}

```


## Error

```
  1 | function Component(props) {
> 2 |   const fbt = require('fbt');
    |         ^^^ Todo: Support local variables named "fbt" (2:2)
  3 |
  4 |   return <fbt desc="Description">{'Text'}</fbt>;
  5 | }
```
          
      