
## Input

```javascript
// @inferEffectDependencies @noEmit
import {print} from 'shared-runtime';
import useEffectWrapper from 'useEffectWrapper';

function ReactiveVariable({propVal}) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr));
}

```

## Code

```javascript
// @inferEffectDependencies @noEmit
import { print } from "shared-runtime";
import useEffectWrapper from "useEffectWrapper";

function ReactiveVariable({ propVal }) {
  const arr = [propVal];
  useEffectWrapper(() => print(arr));
}

```
      
### Eval output
(kind: exception) Fixture not implemented