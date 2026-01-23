
## Input

```javascript
import {throwErrorWithMessage} from 'shared-runtime';

/**
 * Test conditional return in catch block.
 * When shouldThrow is true and returnFromCatch is true, returns from catch.
 * When shouldThrow is true and returnFromCatch is false, falls through.
 * When shouldThrow is false, try block succeeds.
 */
function Component(props) {
  'use memo';
  try {
    if (props.shouldThrow) {
      throwErrorWithMessage(props.message);
    }
    return props.tryValue;
  } catch {
    if (props.returnFromCatch) {
      return props.catchValue;
    }
  } finally {
    console.log('finally');
  }
  return props.fallbackValue;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{shouldThrow: true, returnFromCatch: true, message: 'err', tryValue: 't', catchValue: 'caught', fallbackValue: 'fb'}],
  sequentialRenders: [
    // Throw + return from catch
    {shouldThrow: true, returnFromCatch: true, message: 'err1', tryValue: 't', catchValue: 'caught1', fallbackValue: 'fb'},
    // Throw + don't return from catch -> falls through to fallback
    {shouldThrow: true, returnFromCatch: false, message: 'err2', tryValue: 't', catchValue: 'ignored', fallbackValue: 'fallback1'},
    // Don't throw - try returns
    {shouldThrow: false, returnFromCatch: true, message: 'err3', tryValue: 'try-success', catchValue: 'not-used', fallbackValue: 'fb'},
    // Same as previous, should reuse
    {shouldThrow: false, returnFromCatch: true, message: 'err3', tryValue: 'try-success', catchValue: 'not-used', fallbackValue: 'fb'},
    // Throw + return from catch again
    {shouldThrow: true, returnFromCatch: true, message: 'err4', tryValue: 't', catchValue: 'caught4', fallbackValue: 'fb'},
  ],
};

```

## Code

```javascript
import { throwErrorWithMessage } from "shared-runtime";

/**
 * Test conditional return in catch block.
 * When shouldThrow is true and returnFromCatch is true, returns from catch.
 * When shouldThrow is true and returnFromCatch is false, falls through.
 * When shouldThrow is false, try block succeeds.
 */
function Component(props) {
  "use memo";

  try {
    if (props.shouldThrow) {
      throwErrorWithMessage(props.message);
    }
    return props.tryValue;
  } catch {
    if (props.returnFromCatch) {
      return props.catchValue;
    }
  } finally {
    console.log("finally");
  }
  return props.fallbackValue;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      shouldThrow: true,
      returnFromCatch: true,
      message: "err",
      tryValue: "t",
      catchValue: "caught",
      fallbackValue: "fb",
    },
  ],
  sequentialRenders: [
    // Throw + return from catch
    {
      shouldThrow: true,
      returnFromCatch: true,
      message: "err1",
      tryValue: "t",
      catchValue: "caught1",
      fallbackValue: "fb",
    },
    // Throw + don't return from catch -> falls through to fallback
    {
      shouldThrow: true,
      returnFromCatch: false,
      message: "err2",
      tryValue: "t",
      catchValue: "ignored",
      fallbackValue: "fallback1",
    },
    // Don't throw - try returns
    {
      shouldThrow: false,
      returnFromCatch: true,
      message: "err3",
      tryValue: "try-success",
      catchValue: "not-used",
      fallbackValue: "fb",
    },
    // Same as previous, should reuse
    {
      shouldThrow: false,
      returnFromCatch: true,
      message: "err3",
      tryValue: "try-success",
      catchValue: "not-used",
      fallbackValue: "fb",
    },
    // Throw + return from catch again
    {
      shouldThrow: true,
      returnFromCatch: true,
      message: "err4",
      tryValue: "t",
      catchValue: "caught4",
      fallbackValue: "fb",
    },
  ],
};

```
      
### Eval output
(kind: ok) "caught1"
"fallback1"
"try-success"
"try-success"
"caught4"
logs: ['finally','finally','finally','finally','finally']