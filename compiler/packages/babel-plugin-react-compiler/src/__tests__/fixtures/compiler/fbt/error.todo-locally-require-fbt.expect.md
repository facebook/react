
## Input

```javascript
function Component(props) {
  const fbt = require('fbt');

  return <fbt desc="Description">{'Text'}</fbt>;
}

```


## Error

```
Found 1 error:

Invariant: <fbt> tags should be module-level imports

error.todo-locally-require-fbt.ts:4:10
  2 |   const fbt = require('fbt');
  3 |
> 4 |   return <fbt desc="Description">{'Text'}</fbt>;
    |           ^^^ <fbt> tags should be module-level imports
  5 | }
  6 |
```
          
      