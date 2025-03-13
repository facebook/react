
## Input

```javascript
// @gating
import {memo} from 'react';

export default memo(Foo);
function Foo() {}

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag"; // @gating
import { memo } from "react";

export default memo(Foo);
const _isForgetEnabled_Fixtures_result = isForgetEnabled_Fixtures();
function _Foo_optimized() {}
function _Foo_unoptimized() {}
function Foo(...args) {
  if (_isForgetEnabled_Fixtures_result) return _Foo_optimized(...args);
  else return _Foo_unoptimized(...args);
}

```
      