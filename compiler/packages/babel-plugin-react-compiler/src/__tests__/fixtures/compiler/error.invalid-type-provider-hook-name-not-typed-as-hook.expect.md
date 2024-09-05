
## Input

```javascript
import {useHookNotTypedAsHook} from 'ReactCompilerTest';

function Component() {
  return useHookNotTypedAsHook();
}

```


## Error

```
  2 |
  3 | function Component() {
> 4 |   return useHookNotTypedAsHook();
    |          ^^^^^^^^^^^^^^^^^^^^^ InvalidConfig: Invalid type configuration for module. Expected type for `import {useHookNotTypedAsHook} from 'ReactCompilerTest'` to be a hook based on the exported name (4:4)
  5 | }
  6 |
```
          
      