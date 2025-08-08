
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
Found 1 error:

Error: Cannot access variable before it is declared

Reading a variable before it is initialized will prevent the earlier access from updating when this value changes over time. Instead, move the variable access to after it has been initialized.

   9 |   // TDZ violation!
  10 |   const onRefetch = useCallback(() => {
> 11 |     refetch(data);
     |             ^^^^ `data` is accessed before it is declared
  12 |   }, [refetch]);
  13 |
  14 |   // The context variable gets frozen here since it's passed to a hook

  17 |   // This has to error: onRefetch needs to memoize with `content` as a
  18 |   // dependency, but the dependency comes later
> 19 |   const {data = null} = content;
     |          ^^^^^^^^^^^ `data` is declared here
  20 |
  21 |   return <Foo data={data} onSubmit={onSubmit} />;
  22 | }
```
          
      