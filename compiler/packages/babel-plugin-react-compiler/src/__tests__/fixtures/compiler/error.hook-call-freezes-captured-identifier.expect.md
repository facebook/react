
## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions
import {setPropertyByKey, Stringify, useIdentity} from 'shared-runtime';

function Foo({count}) {
  const x = {value: 0};
  /**
   * After this custom hook call, it's no longer valid to mutate x.
   */
  const cb = useIdentity(() => {
    setPropertyByKey(x, 'value', count);
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
     |   ^ InvalidReact: This mutates a variable that React considers immutable (13:13)
  14 |   return <Stringify x={x} cb={cb} />;
  15 | }
  16 |
```
          
      