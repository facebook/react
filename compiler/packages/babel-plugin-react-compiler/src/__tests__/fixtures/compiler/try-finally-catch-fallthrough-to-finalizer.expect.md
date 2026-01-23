
## Input

```javascript
import {throwErrorWithMessage} from 'shared-runtime';

/**
 * Test that catch block's fallthrough correctly flows to finalizer.
 * This specifically tests the control flow fix where catch block's goto
 * must target the finalizer block (not the continuation) when there's
 * a finally clause.
 *
 * The conditional in catch creates two paths:
 * 1. Return from catch (returnFromCatch=true)
 * 2. Fall through catch -> finalizer -> continuation (returnFromCatch=false)
 *
 * Without the fix, path 2 would fail with "Expected a break target" because
 * the finalizer wasn't scheduled as a break target for catch block gotos.
 */
function Component(props) {
  'use memo';
  let result = 'initial';
  try {
    if (props.shouldThrow) {
      throwErrorWithMessage(props.message);
    }
    result = props.tryValue;
  } catch {
    // This conditional creates a fallthrough path that needs to reach finalizer
    if (props.returnFromCatch) {
      return props.catchReturnValue;
    }
    // Fallthrough path - must go through finalizer before continuation
    result = props.catchFallthrough;
  } finally {
    console.log('finally ran');
  }
  return result;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{
    shouldThrow: true,
    returnFromCatch: false,
    message: 'test',
    tryValue: 'try',
    catchReturnValue: 'catch-return',
    catchFallthrough: 'catch-fell-through',
  }],
  sequentialRenders: [
    // Path: throw -> catch returns
    {shouldThrow: true, returnFromCatch: true, message: 'e1',
      tryValue: 't', catchReturnValue: 'returned-from-catch', catchFallthrough: 'x'},
    // Path: throw -> catch falls through -> finalizer -> return result
    // This is the critical path that tests the fix
    {shouldThrow: true, returnFromCatch: false, message: 'e2',
      tryValue: 't', catchReturnValue: 'x', catchFallthrough: 'fell-through-catch'},
    // Path: no throw -> try succeeds
    {shouldThrow: false, returnFromCatch: false, message: 'e3',
      tryValue: 'try-succeeded', catchReturnValue: 'x', catchFallthrough: 'x'},
    // Same as previous - verify memoization
    {shouldThrow: false, returnFromCatch: false, message: 'e3',
      tryValue: 'try-succeeded', catchReturnValue: 'x', catchFallthrough: 'x'},
    // Back to fallthrough path
    {shouldThrow: true, returnFromCatch: false, message: 'e4',
      tryValue: 't', catchReturnValue: 'x', catchFallthrough: 'another-fallthrough'},
  ],
};

```

## Code

```javascript
import { throwErrorWithMessage } from "shared-runtime";

/**
 * Test that catch block's fallthrough correctly flows to finalizer.
 * This specifically tests the control flow fix where catch block's goto
 * must target the finalizer block (not the continuation) when there's
 * a finally clause.
 *
 * The conditional in catch creates two paths:
 * 1. Return from catch (returnFromCatch=true)
 * 2. Fall through catch -> finalizer -> continuation (returnFromCatch=false)
 *
 * Without the fix, path 2 would fail with "Expected a break target" because
 * the finalizer wasn't scheduled as a break target for catch block gotos.
 */
function Component(props) {
  "use memo";

  let result = "initial";
  try {
    if (props.shouldThrow) {
      throwErrorWithMessage(props.message);
    }

    result = props.tryValue;
  } catch {
    if (props.returnFromCatch) {
      return props.catchReturnValue;
    }

    result = props.catchFallthrough;
  } finally {
    console.log("finally ran");
  }
  return result;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      shouldThrow: true,
      returnFromCatch: false,
      message: "test",
      tryValue: "try",
      catchReturnValue: "catch-return",
      catchFallthrough: "catch-fell-through",
    },
  ],
  sequentialRenders: [
    // Path: throw -> catch returns
    {
      shouldThrow: true,
      returnFromCatch: true,
      message: "e1",
      tryValue: "t",
      catchReturnValue: "returned-from-catch",
      catchFallthrough: "x",
    },
    // Path: throw -> catch falls through -> finalizer -> return result
    // This is the critical path that tests the fix
    {
      shouldThrow: true,
      returnFromCatch: false,
      message: "e2",
      tryValue: "t",
      catchReturnValue: "x",
      catchFallthrough: "fell-through-catch",
    },
    // Path: no throw -> try succeeds
    {
      shouldThrow: false,
      returnFromCatch: false,
      message: "e3",
      tryValue: "try-succeeded",
      catchReturnValue: "x",
      catchFallthrough: "x",
    },
    // Same as previous - verify memoization
    {
      shouldThrow: false,
      returnFromCatch: false,
      message: "e3",
      tryValue: "try-succeeded",
      catchReturnValue: "x",
      catchFallthrough: "x",
    },
    // Back to fallthrough path
    {
      shouldThrow: true,
      returnFromCatch: false,
      message: "e4",
      tryValue: "t",
      catchReturnValue: "x",
      catchFallthrough: "another-fallthrough",
    },
  ],
};

```
      
### Eval output
(kind: ok) "returned-from-catch"
"fell-through-catch"
"try-succeeded"
"try-succeeded"
"another-fallthrough"
logs: ['finally ran','finally ran','finally ran','finally ran','finally ran']