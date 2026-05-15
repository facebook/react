
## Input

```javascript
// @enableEmitStructuredHooks @target:"18"

import {useEffect} from 'react';

function Foo(props) {
  'use structured hooks';

  useEffect(() => {
    console.log(props.label);
  }, [props.label]);

  return <div>{props.label}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{label: 'Ada'}],
};
```


## Error

```
Found 1 error:

Todo: Structured hooks prototype only supports hook calls in direct variable initializers. Found useEffect().

error.todo-unsupported-hook.ts:8:2
   6 |   'use structured hooks';
   7 |
>  8 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
>  9 |     console.log(props.label);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 10 |   }, [props.label]);
     | ^^^^^^^^^^^^^^^^^^^^ Structured hooks prototype only supports hook calls in direct variable initializers. Found useEffect().
  11 |
  12 |   return <div>{props.label}</div>;
  13 | }
```
          
      