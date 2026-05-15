# `dom-event-testing-library`

A library for unit testing events via high-level interactions, e.g., `pointerdown`,
that produce realistic and complete DOM event sequences.

There are number of challenges involved in unit testing modules that work with
DOM events.

1. Gesture recognizers may need to support environments with and without support for
   the `PointerEvent` API.
2. Gesture recognizers may need to support various user interaction modes including
   mouse, touch, and pen use.
3. Gesture recognizers must account for the actual event sequences browsers produce
   (e.g., emulated touch and mouse events.)
4. Gesture recognizers must work with "virtual" events produced by tools like
   screen-readers.

Writing unit tests to cover all these scenarios is tedious and error prone. This
event testing library is designed to solve these issues by allowing developers to
more easily dispatch events in unit tests, and to more reliably test pointer
interactions using a high-level API based on `PointerEvent`. Here's a basic example:

```js
import {
  describeWithPointerEvent,
  testWithPointerType,
  createEventTarget,
  setPointerEvent,
  resetActivePointers
} from 'dom-event-testing-library';

describeWithPointerEvent('useTap', hasPointerEvent => {
  beforeEach(() => {
    // basic PointerEvent mock
    setPointerEvent(hasPointerEvent);
  });

  afterEach(() => {
    // clear active pointers between test runs
    resetActivePointers();
  });

  // test all the pointer types supported by the environment
  testWithPointerType('pointer down', pointerType => {
    const ref = createRef(null);
    const onTapStart = jest.fn();
    render(() => {
      useTap(ref, { onTapStart });
      return <div ref={ref} />
    });

    // create an event target
    const target = createEventTarget(ref.current);
    // dispatch high-level pointer event
    target.pointerdown({ pointerType });

    expect(onTapStart).toBeCalled();
  });
});
```

This tests the interaction in multiple scenarios. In each case, a realistic DOM
event sequence–with complete mock events–is produced. When running in a mock
environment without the `PointerEvent` API, the test runs for both `mouse` and
`touch` pointer types. When `touch` is the pointer type it produces emulated mouse
events. When running in a mock environment with the `PointerEvent` API, the test
runs for `mouse`, `touch`, and `pen` pointer types.

It's important to cover all these scenarios because it's very easy to introduce
bugs – e.g., double calling of callbacks – if not accounting for emulated mouse
events, differences in target capturing between `touch` and `mouse` pointers, and
the different semantics of `button` across event APIs.

Default values are provided for the expected native events properties. They can
also be customized as needed in a test.

```js
target.pointerdown({
  button: 0,
  buttons: 1,
  pageX: 10,
  pageY: 10,
  pointerType,
  // NOTE: use x,y instead of clientX,clientY
  x: 10,
  y: 10
});
```

Tests that dispatch multiple pointer events will dispatch multi-touch native events
on the target.

```js
// first pointer is active
target.pointerdown({pointerId: 1, pointerType});
// second pointer is active
target.pointerdown({pointerId: 2, pointerType});
```
