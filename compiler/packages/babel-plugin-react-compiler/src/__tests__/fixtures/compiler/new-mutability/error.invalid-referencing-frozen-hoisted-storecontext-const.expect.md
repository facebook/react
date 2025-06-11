
## Input

```javascript
//@flow @validatePreserveExistingMemoizationGuarantees @enableNewMutationAliasingModel

import {useCallback} from 'react';
import {useIdentity} from 'shared-runtime';

function Component({content, refetch}) {
  // This callback function accesses a hoisted const as a dependency,
  // but it cannot reference it as a dependency since that would be a
  // TDZ violation!
  const onRefetch = useCallback(() => {
    refetch(data);
  }, [refetch]);

  // The context variable gets frozen here since it's passed to a hook
  const onSubmit = useIdentity(onRefetch);

  // This has to error: onRefetch needs to memoize with `content` as a
  // dependency, but the dependency comes later
  const {data = null} = content;

  return <Foo data={data} onSubmit={onSubmit} />;
}

```


## Error

```
  17 |   // This has to error: onRefetch needs to memoize with `content` as a
  18 |   // dependency, but the dependency comes later
> 19 |   const {data = null} = content;
     |          ^^^^^^^^^^^ InvalidReact: This variable is accessed before it is declared, which prevents the earlier access from updating when this value changes over time. Move the declaration of `data` to before it is first referenced (19:19)
  20 |
  21 |   return <Foo data={data} onSubmit={onSubmit} />;
  22 | }
```
          
      