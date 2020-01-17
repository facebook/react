# `react-interactions/events`

*This package is experimental. It is intended for use with the experimental React
events API that is not available in open source builds.*

Event Responders attach to a host node. They listen to native browser events
dispatched on the host node of their child and transform those events into
high-level events for applications.

The core API is documented below. Documentation for individual Event Responders
can be found [here](./docs).

## Event Responder Interface

Note: React Responders require the internal React flag `enableDeprecatedFlareAPI`.

An Event Responder Interface is defined using an object. Each responder can define DOM
events to listen to, handle the synthetic responder events, dispatch custom
events, and implement a state machine.

```js
// types
type ResponderEventType = string;

type ResponderEvent = {|
  nativeEvent: any,
  target: Element | Document,
  pointerType: string,
  type: string,
  passive: boolean,
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

### dispatchEvent(propName: string, event: CustomEvent, { discrete: boolean })

Dispatches a custom synthetic event. The `type` and `target` are required
fields if the event is an object, but any other fields can be defined on the `event` that will be passed
to the `listener`. You can also pass a value that is not an object, but a `boolean`. For example:

```js
const event = { type: 'press', target, pointerType, x, y };
context.dispatchEvent('onPress', event, DiscreteEvent);
```

### isTargetWithinNode(target: Element, element: Element): boolean

Returns `true` if `target` is a child of `element`.

### isTargetWithinResponder(target: Element): boolean

Returns `true` is the target element is within the subtree of the Event Responder.

### isTargetWithinResponderScope(target: Element): boolean

Returns `true` is the target element is within the current Event Responder's scope. If the target element
is within the scope of the same responder, but owned by another Event Responder instance, this will return `false`.

### removeRootEventTypes(eventTypes: Array<ResponderEventType>)

Remove the root event types added with `addRootEventTypes`.
