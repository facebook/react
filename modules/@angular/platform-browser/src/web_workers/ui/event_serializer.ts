import {Set} from '../../facade/collection';
import {isPresent} from '../../facade/lang';

const MOUSE_EVENT_PROPERTIES = [
  'altKey', 'button', 'clientX', 'clientY', 'metaKey', 'movementX', 'movementY', 'offsetX',
  'offsetY', 'region', 'screenX', 'screenY', 'shiftKey'
];

const KEYBOARD_EVENT_PROPERTIES = [
  'altkey', 'charCode', 'code', 'ctrlKey', 'isComposing', 'key', 'keyCode', 'location', 'metaKey',
  'repeat', 'shiftKey', 'which'
];

const TRANSITION_EVENT_PROPERTIES = ['propertyName', 'elapsedTime', 'pseudoElement'];

const EVENT_PROPERTIES = ['type', 'bubbles', 'cancelable'];

const NODES_WITH_VALUE = new Set(
    ['input', 'select', 'option', 'button', 'li', 'meter', 'progress', 'param', 'textarea']);

export function serializeGenericEvent(e: Event): {[key: string]: any} {
  return serializeEvent(e, EVENT_PROPERTIES);
}

// TODO(jteplitz602): Allow users to specify the properties they need rather than always
// adding value and files #3374
export function serializeEventWithTarget(e: Event): {[key: string]: any} {
  var serializedEvent = serializeEvent(e, EVENT_PROPERTIES);
  return addTarget(e, serializedEvent);
}

export function serializeMouseEvent(e: MouseEvent): {[key: string]: any} {
  return serializeEvent(e, MOUSE_EVENT_PROPERTIES);
}

export function serializeKeyboardEvent(e: KeyboardEvent): {[key: string]: any} {
  var serializedEvent = serializeEvent(e, KEYBOARD_EVENT_PROPERTIES);
  return addTarget(e, serializedEvent);
}

export function serializeTransitionEvent(e: TransitionEvent): {[key: string]: any} {
  var serializedEvent = serializeEvent(e, TRANSITION_EVENT_PROPERTIES);
  return addTarget(e, serializedEvent);
}

// TODO(jteplitz602): #3374. See above.
function addTarget(e: Event, serializedEvent: {[key: string]: any}): {[key: string]: any} {
  if (NODES_WITH_VALUE.has((<HTMLElement>e.target).tagName.toLowerCase())) {
    var target = <HTMLInputElement>e.target;
    serializedEvent['target'] = {'value': target.value};
    if (isPresent(target.files)) {
      serializedEvent['target']['files'] = target.files;
    }
  }
  return serializedEvent;
}

function serializeEvent(e: any, properties: string[]): {[key: string]: any} {
  var serialized = {};
  for (var i = 0; i < properties.length; i++) {
    var prop = properties[i];
    (serialized as any /** TODO #9100 */)[prop] = e[prop];
  }
  return serialized;
}
