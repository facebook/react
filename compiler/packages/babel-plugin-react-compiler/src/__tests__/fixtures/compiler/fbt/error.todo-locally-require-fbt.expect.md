
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

Todo: Support local variables named `fbt`

Local variables named `fbt` may conflict with the fbt plugin and are not yet supported

error.todo-locally-require-fbt.ts:2:8
  1 | function Component(props) {
> 2 |   const fbt = require('fbt');
    |         ^^^ Rename to avoid conflict with fbt plugin
  3 |
  4 |   return <fbt desc="Description">{'Text'}</fbt>;
  5 | }
```
          
      