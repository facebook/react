
## Input

```javascript
import {notAhookTypedAsHook} from 'ReactCompilerTest';

function Component() {
  return <div>{notAhookTypedAsHook()}</div>;
}

```


## Error

```
  2 |
  3 | function Component() {
> 4 |   return <div>{notAhookTypedAsHook()}</div>;
    |                ^^^^^^^^^^^^^^^^^^^ InvalidConfig: Invalid type configuration for module. Expected type for object property 'useHookNotTypedAsHook' from module 'ReactCompilerTest' to be a hook based on the property name (4:4)
  5 | }
  6 |
```
          
      