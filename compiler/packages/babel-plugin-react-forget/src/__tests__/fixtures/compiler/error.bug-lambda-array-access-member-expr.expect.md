
## Input

```javascript
import { invoke } from "shared-runtime";

function Foo() {
  const x = [{ value: 0 }, { value: 1 }, { value: 2 }];
  const foo = (param: number) => {
    return x[param].value;
  };

  return invoke(foo, 1);
}

export const FIXTURE_ENTRYPONT = {
  fn: Foo,
  params: [{}],
};

```


## Error

```
[ReactForget] Todo: EnterSSA: Expected identifier to be defined before being used. Identifier param$10 is undefined (5:5)
```
          
      