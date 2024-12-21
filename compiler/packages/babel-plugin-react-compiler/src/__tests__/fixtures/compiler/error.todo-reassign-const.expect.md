
## Input

```javascript
import {Stringify} from 'shared-runtime';

function Component({foo}) {
  let bar = foo.bar;
  return (
    <Stringify
      handler={() => {
        foo = true;
      }}
    />
  );
}

```


## Error

```
  1 | import {Stringify} from 'shared-runtime';
  2 |
> 3 | function Component({foo}) {
    |                     ^^^ Todo: Support destructuring of context variables (3:3)
  4 |   let bar = foo.bar;
  5 |   return (
  6 |     <Stringify
```
          
      