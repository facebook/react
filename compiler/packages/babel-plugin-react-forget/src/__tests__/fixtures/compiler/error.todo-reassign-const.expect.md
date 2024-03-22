
## Input

```javascript
import { Stringify } from "shared-runtime";

function Component({ foo }) {
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
  2 |
  3 | function Component({ foo }) {
> 4 |   let bar = foo.bar;
    |             ^^^ [ReactForget] Invariant: Expected all references to a variable to be consistently local or context references. Identifier <unknown> foo$1 is referenced as a context variable, but was previously referenced as a local variable (4:4)
  5 |   return (
  6 |     <Stringify
  7 |       handler={() => {
```
          
      