
## Input

```javascript
function Component(props) {
  const fbt = require("fbt");

  return <fbt desc="Description">{"Text"}</fbt>;
}

```


## Error

```
  2 |   const fbt = require("fbt");
  3 |
> 4 |   return <fbt desc="Description">{"Text"}</fbt>;
    |           ^^^ [ReactForget] Todo: Support <fbt> tags where 'fbt' is a local variable instead of a global (4:4)
  5 | }
  6 |
```
          
      