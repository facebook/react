
## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions
import {mutate, Stringify, useIdentity} from 'shared-runtime';

function Foo({count}) {
  const x = {value: 0};
  /**
   * After this custom hook call, it's no longer valid to mutate x.
   */
  const cb = useIdentity(() => {
    x.value++;
  });

  x.value += count;
  return <Stringify x={x} cb={cb} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{count: 1}],
};

```


## Error

```
  11 |   });
  12 |
> 13 |   x.value += count;
     |   ^ InvalidReact: Updating a value previously passed as an argument to a hook is not allowed. Consider moving the mutation before calling the hook (13:13)
  14 |   return <Stringify x={x} cb={cb} />;
  15 | }
  16 |
```
          
      