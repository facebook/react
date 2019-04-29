# `react-events`

*This package is experimental. It is intended for use with the experimental React
events API that is not available in open source builds.*

Event components do not render a host node. They listen to native browser events
dispatched on the host node of their child and transform those events into
high-level events for applications.

The core API is documented below. Documentation for individual Event Components
can be found [here](./docs).

## EventComponent

An Event Component is defined by a module that exports an object of the
following type:

```js
type EventComponent = {|
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  displayName?: string,
  props: null | Object,
  responder: EventResponder,
|};
```

## EventResponder

An Event Responder is defined using an object. Each responder can define DOM
events to listen to, handle the synthetic responder events, dispatch custom
events, and implement a state machine.

```js
// types
type ResponderEventType =
  | string
  | {name: string, passive?: boolean};

type ResponderEvent = {|
  nativeEvent: any,
  target: Element | Document,
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

### createInitialState?: (props: null | Object) => Object

The initial state of that the Event Component is created with.

### onEvent?: (event: ResponderEvent, context: ResponderContext, props, state)

Called during the bubble phase of the `targetEventTypes` dispatched on DOM
elements within the Event Component.

### onEventCapture?: (event: ResponderEvent, context: ResponderContext, props, state)

Called during the capture phase of the `targetEventTypes` dispatched on DOM
elements within the Event Component.

### onMount?: (context: ResponderContext, props, state)

Called after an Event Component in mounted.

### onOwnershipChange?: (context: ResponderContext, props, state)

Called when ownership is granted or terminated (either globally or for the responder) for an Event Component instance.

### onRootEvent?: (event: ResponderEvent, context: ResponderContext, props, state)

Called when any of the `rootEventTypes` are dispatched on the root of the app.

### onUnmount?: (context: ResponderContext, props, state)

Called before an Event Component in unmounted.

### rootEventTypes?: Array<ResponderEventType>

Defines the DOM events to listen to on the root of the app.

### stopLocalPropagation: boolean

Defines whether or not synthetic events propagate to other Event Components *of
the same type*. This has no effect on propagation of the source DOM events or
the synthetic events dispatched to Event Components of different types.

### targetEventTypes?: Array<ResponderEventType>

Defines the DOM events to listen to within the Event Component subtree.


## ResponderContext

The Event Responder Context is exposed via the `context` argument for certain methods
on the `EventResponder` object.

### addRootEventTypes(eventTypes: Array<ResponderEventType>)

This can be used to dynamically listen to events on the root of the app only
when it is necessary to do so.

### clearTimeout(id: Symbol): void

Clear a timeout defined using `context.setTimeout`.

### dispatchEvent(event: CustomEvent, listener, { discrete: boolean })

Dispatches a custom synthetic event. The `type` and `target` are required
fields, but any other fields can be defined on the `event` that will be passed
to the `listener`. For example:

```js
const event = { type: 'press', target, pointerType, x, y };
context.dispatchEvent(event, props.onPress, { discrete: true });
```

### getFocusableElementsInScope(): Array<Element>

Returns every DOM element that can be focused within the scope of the Event
Component instance.

### hasOwnership(): boolean

Returns `true` if the instance has taken ownership of the responder.

### isPositionWithinTouchHitTarget(x: number, y: number): boolean

Returns `true` if the global coordinates lie within the TouchHitTarget.

### isTargetDirectlyWithinEventComponent(target: Element): boolean

Returns `true` is the target element is within the direct subtree of the Event Component instance, i.e., the target is not nested within an Event Component instance that is a descendant of the current instance.

### isTargetWithinElement(target: Element, element: Element): boolean

Returns `true` if `target` is a child of `element`.

### isTargetWithinEventComponent(target: Element): boolean

Returns `true` is the target element is within the subtree of the Event Component instance.

### isTargetWithinEventResponderScope(target: Element): boolean

Returns `true` is the target element is within the current Event Component instance's responder. If the target element
is within the scope of the same responder, but owned by another Event Component instance, this will return `false`.

### releaseOwnership(): boolean

Returns `true` if the instance released ownership of the Event Component instance.

### removeRootEventTypes(eventTypes: Array<ResponderEventType>)

Remove the root event types added with `addRootEventTypes`.

### requestGlobalOwnership(): boolean

The current Event Component instance can request global ownership of the event system. When an Event Component instance
has global ownership, only that instance and its responder are active. To release ownership to other event responders,
either `releaseOwnership()` must be called or the Event Component instance that had global ownership must be
unmounted. Calling `requestGlobalOwnership` also returns `true`/`false` if the request was successful.

### requestResponderOwnership(): boolean

The current Event Component instance can request responder ownership within the event system. When an Event Component
instance has responder ownership, all other Event Component instances that have the same responder as the Event Component
instance will no longer be active. To release ownership to other event responders, either `releaseOwnership()` must be
called or the Event Component instance that had global ownership must be unmounted. Calling `requestResponderOwnership`
also returns `true`/`false` if the request was successful.

### setTimeout(func: () => void, delay: number): Symbol

This can be used to dispatch async events, e.g., those that fire after a delay.
