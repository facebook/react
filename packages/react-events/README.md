# `react-events`

*This package is experimental. It is intended for use with the experimental React
events API that is not available in open source builds.*

Event Responders attach to a host node. They listen to native browser events
dispatched on the host node of their child and transform those events into
high-level events for applications.

The core API is documented below. Documentation for individual Event Responders
can be found [here](./docs).

## Event Responder Interface

An Event Responder Interface is defined using an object. Each responder can define DOM
events to listen to, handle the synthetic responder events, dispatch custom
events, and implement a state machine.

```js
// types
type ResponderEventType = string;

type ResponderEvent = {|
  nativeEvent: any,
  responderTarget: Element | Document,
  target: Element | Document,
  pointerType: string,
  type: string,
  passive: boolean,
  passiveSupported: boolean,
|};

type CustomEvent = {
  type: string,
  target: Element,
  ...
}
```

### getInitialState?: (props: null | Object) => Object

The initial state of that the Event Responder is created with.

### onEvent?: (event: ResponderEvent, context: ResponderContext, props, state)

Called during the bubble phase of the `targetEventTypes` dispatched on DOM
elements within the Event Responder.

### onMount?: (context: ResponderContext, props, state)

Called after an Event Responder in mounted.

### onOwnershipChange?: (context: ResponderContext, props, state)

Called when ownership is granted or terminated (either globally or for the responder) for an Event Responder instance.

### onRootEvent?: (event: ResponderEvent, context: ResponderContext, props, state)

Called when any of the `rootEventTypes` are dispatched on the root of the app.

### onUnmount?: (context: ResponderContext, props, state)

Called before an Event Responder in unmounted.

### rootEventTypes?: Array<ResponderEventType>

Defines the DOM events to listen to on the root of the app.

### targetEventTypes?: Array<ResponderEventType>

Defines the DOM events to listen to within the Event Responder subtree.


## ResponderContext

The Event Responder Context is exposed via the `context` argument for certain methods
on the `EventResponder` object.

### addRootEventTypes(eventTypes: Array<ResponderEventType>)

This can be used to dynamically listen to events on the root of the app only
when it is necessary to do so.

### clearTimeout(id: Symbol): void

Clear a timeout defined using `context.setTimeout`.

### dispatchEvent(propName: string, event: CustomEvent, { discrete: boolean })

Dispatches a custom synthetic event. The `type` and `target` are required
fields if the event is an object, but any other fields can be defined on the `event` that will be passed
to the `listener`. You can also pass a value that is not an object, but a `boolean`. For example:

```js
const event = { type: 'press', target, pointerType, x, y };
context.dispatchEvent('onPress', event, DiscreteEvent);
```

### getFocusableElementsInScope(): Array<Element>

Returns every DOM element that can be focused within the scope of the Event
Responder instance.

### hasOwnership(): boolean

Returns `true` if the instance has taken ownership of the responder.

### isTargetWithinNode(target: Element, element: Element): boolean

Returns `true` if `target` is a child of `element`.

### isTargetWithinResponder(target: Element): boolean

Returns `true` is the target element is within the subtree of the Event Responder.

### isTargetWithinResponderScope(target: Element): boolean

Returns `true` is the target element is within the current Event Responder's scope. If the target element
is within the scope of the same responder, but owned by another Event Responder instance, this will return `false`.

### releaseOwnership(): boolean

Returns `true` if the instance released ownership of the Event Responder instance.

### removeRootEventTypes(eventTypes: Array<ResponderEventType>)

Remove the root event types added with `addRootEventTypes`.

### requestGlobalOwnership(): boolean

The current Event Responder instance can request global ownership of the event system. When an Event Responder instance
has global ownership, only that instance and its responder are active. To release ownership to other event responders,
either `releaseOwnership()` must be called or the Event Responder instance that had global ownership must be
unmounted. Calling `requestGlobalOwnership` also returns `true`/`false` if the request was successful.

### setTimeout(func: () => void, delay: number): Symbol

This can be used to dispatch async events, e.g., those that fire after a delay.
