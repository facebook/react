
## Input

```javascript
// @validateMemoizedEffectDependencies
import {useHook} from 'shared-runtime';

function Component(props) {
  const x = [];
  useHook(); // intersperse a hook call to prevent memoization of x
  x.push(props.value);

  const y = [x];

  useEffect(() => {
    console.log(y);
  }, [y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'sathya'}],
};

```


## Error

```
   9 |   const y = [x];
  10 |
> 11 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
> 12 |     console.log(y);
     | ^^^^^^^^^^^^^^^^^^^
> 13 |   }, [y]);
     | ^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the effect dependencies could not be memoized. Unmemoized effect dependencies can trigger an infinite loop or other unexpected behavior (11:13)
  14 | }
  15 |
  16 | export const FIXTURE_ENTRYPOINT = {
```
          
      