/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SimpleEventPlugin
 */

"use strict";

var AbstractEvent = require('AbstractEvent');
var EventConstants = require('EventConstants');
var EventPropagators = require('EventPropagators');

var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;

var SimpleEventPlugin = {
  abstractEventTypes: {
    // Note: We do not allow listening to mouseOver events. Instead, use the
    // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
    mouseDown: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseDown: true}),
        captured: keyOf({onMouseDownCapture: true})
      }
    },
    mouseUp: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseUp: true}),
        captured: keyOf({onMouseUpCapture: true})
      }
    },
    mouseMove: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseMove: true}),
        captured: keyOf({onMouseMoveCapture: true})
      }
    },
    doubleClick: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDoubleClick: true}),
        captured: keyOf({onDoubleClickCapture: true})
      }
    },
    click: {
      phasedRegistrationNames: {
        bubbled: keyOf({onClick: true}),
        captured: keyOf({onClickCapture: true})
      }
    },
    wheel: {
      phasedRegistrationNames: {
        bubbled: keyOf({onWheel: true}),
        captured: keyOf({onWheelCapture: true})
      }
    },
    touchStart: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchStart: true}),
        captured: keyOf({onTouchStartCapture: true})
      }
    },
    touchEnd: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchEnd: true}),
        captured: keyOf({onTouchEndCapture: true})
      }
    },
    touchCancel: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchCancel: true}),
        captured: keyOf({onTouchCancelCapture: true})
      }
    },
    touchMove: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchMove: true}),
        captured: keyOf({onTouchMoveCapture: true})
      }
    },
    keyUp: {
      phasedRegistrationNames: {
        bubbled: keyOf({onKeyUp: true}),
        captured: keyOf({onKeyUpCapture: true})
      }
    },
    keyPress: {
      phasedRegistrationNames: {
        bubbled: keyOf({onKeyPress: true}),
        captured: keyOf({onKeyPressCapture: true})
      }
    },
    keyDown: {
      phasedRegistrationNames: {
        bubbled: keyOf({onKeyDown: true}),
        captured: keyOf({onKeyDownCapture: true})
      }
    },
    input: {
      phasedRegistrationNames: {
        bubbled: keyOf({onInput: true}),
        captured: keyOf({onInputCapture: true})
      }
    },
    focus: {
      phasedRegistrationNames: {
        bubbled: keyOf({onFocus: true}),
        captured: keyOf({onFocusCapture: true})
      }
    },
    blur: {
      phasedRegistrationNames: {
        bubbled: keyOf({onBlur: true}),
        captured: keyOf({onBlurCapture: true})
      }
    },
    scroll: {
      phasedRegistrationNames: {
        bubbled: keyOf({onScroll: true}),
        captured: keyOf({onScrollCapture: true})
      }
    },
    change: {
      phasedRegistrationNames: {
        bubbled: keyOf({onChange: true}),
        captured: keyOf({onChangeCapture: true})
      }
    },
    submit: {
      phasedRegistrationNames: {
        bubbled: keyOf({onSubmit: true}),
        captured: keyOf({onSubmitCapture: true})
      }
    },
    DOMCharacterDataModified: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDOMCharacterDataModified: true}),
        captured: keyOf({onDOMCharacterDataModifiedCapture: true})
      }
    },
    drag: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDrag: true}),
        captured: keyOf({onDragCapture: true})
      }
    },
    dragEnd: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDragEnd: true}),
        captured: keyOf({onDragEndCapture: true})
      }
    },
    dragEnter: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDragEnter: true}),
        captured: keyOf({onDragEnterCapture: true})
      }
    },
    dragExit: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDragExit: true}),
        captured: keyOf({onDragExitCapture: true})
      }
    },
    dragLeave: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDragLeave: true}),
        captured: keyOf({onDragLeaveCapture: true})
      }
    },
    dragOver: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDragOver: true}),
        captured: keyOf({onDragOverCapture: true})
      }
    },
    dragStart: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDragStart: true}),
        captured: keyOf({onDragStartCapture: true})
      }
    },
    drop: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDrop: true}),
        captured: keyOf({onDropCapture: true})
      }
    }
  },

  /**
   * Same as the default implementation, except cancels the event when return
   * value is false.
   *
   * @param {AbstractEvent} AbstractEvent to handle
   * @param {function} Application-level callback
   * @param {string} domID DOM id to pass to the callback.
   */
  executeDispatch: function(abstractEvent, listener, domID) {
    var returnValue = listener(abstractEvent, domID);
    if (returnValue === false) {
      abstractEvent.stopPropagation();
      abstractEvent.preventDefault();
    }
  },

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of `AbstractEvent`s.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var data;
    var abstractEventType =
      SimpleEventPlugin.topLevelTypesToAbstract[topLevelType];
    if (!abstractEventType) {
      return null;
    }
    switch(topLevelType) {
      case topLevelTypes.topWheel:
        data = AbstractEvent.normalizeMouseWheelData(nativeEvent);
        break;
      case topLevelTypes.topScroll:
        data = AbstractEvent.normalizeScrollDataFromTarget(topLevelTarget);
        break;
      case topLevelTypes.topClick:
      case topLevelTypes.topDoubleClick:
      case topLevelTypes.topChange:
      case topLevelTypes.topDOMCharacterDataModified:
      case topLevelTypes.topMouseDown:
      case topLevelTypes.topMouseUp:
      case topLevelTypes.topMouseMove:
      case topLevelTypes.topTouchMove:
      case topLevelTypes.topTouchStart:
      case topLevelTypes.topTouchEnd:
      case topLevelTypes.topDrag:
      case topLevelTypes.topDragEnd:
      case topLevelTypes.topDragEnter:
      case topLevelTypes.topDragExit:
      case topLevelTypes.topDragLeave:
      case topLevelTypes.topDragOver:
      case topLevelTypes.topDragStart:
      case topLevelTypes.topDrop:
        data = AbstractEvent.normalizePointerData(nativeEvent);
        // todo: Use AbstractEvent.normalizeDragEventData for drag/drop?
        break;
      default:
        data = null;
    }
    var abstractEvent = AbstractEvent.getPooled(
      abstractEventType,
      topLevelTargetID,
      nativeEvent,
      data
    );
    EventPropagators.accumulateTwoPhaseDispatches(abstractEvent);
    return abstractEvent;
  }
};

SimpleEventPlugin.topLevelTypesToAbstract = {
  topMouseDown:   SimpleEventPlugin.abstractEventTypes.mouseDown,
  topMouseUp:     SimpleEventPlugin.abstractEventTypes.mouseUp,
  topMouseMove:   SimpleEventPlugin.abstractEventTypes.mouseMove,
  topClick:       SimpleEventPlugin.abstractEventTypes.click,
  topDoubleClick: SimpleEventPlugin.abstractEventTypes.doubleClick,
  topWheel:       SimpleEventPlugin.abstractEventTypes.wheel,
  topTouchStart:  SimpleEventPlugin.abstractEventTypes.touchStart,
  topTouchEnd:    SimpleEventPlugin.abstractEventTypes.touchEnd,
  topTouchMove:   SimpleEventPlugin.abstractEventTypes.touchMove,
  topTouchCancel: SimpleEventPlugin.abstractEventTypes.touchCancel,
  topKeyUp:       SimpleEventPlugin.abstractEventTypes.keyUp,
  topKeyPress:    SimpleEventPlugin.abstractEventTypes.keyPress,
  topKeyDown:     SimpleEventPlugin.abstractEventTypes.keyDown,
  topInput:       SimpleEventPlugin.abstractEventTypes.input,
  topFocus:       SimpleEventPlugin.abstractEventTypes.focus,
  topBlur:        SimpleEventPlugin.abstractEventTypes.blur,
  topScroll:      SimpleEventPlugin.abstractEventTypes.scroll,
  topChange:      SimpleEventPlugin.abstractEventTypes.change,
  topSubmit:      SimpleEventPlugin.abstractEventTypes.submit,
  topDOMCharacterDataModified:
                  SimpleEventPlugin.abstractEventTypes.DOMCharacterDataModified,
  topDrag:        SimpleEventPlugin.abstractEventTypes.drag,
  topDragEnd:     SimpleEventPlugin.abstractEventTypes.dragEnd,
  topDragEnter:   SimpleEventPlugin.abstractEventTypes.dragEnter,
  topDragExit:    SimpleEventPlugin.abstractEventTypes.dragExit,
  topDragLeave:   SimpleEventPlugin.abstractEventTypes.dragLeave,
  topDragOver:    SimpleEventPlugin.abstractEventTypes.dragOver,
  topDragStart:   SimpleEventPlugin.abstractEventTypes.dragStart,
  topDrop:        SimpleEventPlugin.abstractEventTypes.drop
};

module.exports = SimpleEventPlugin;
