var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

////////////////////////////////////////////////////////////////////////////////
// Welcome to @reach/tooltip!
//
// Quick definitions:
//
// - "on rest" or "rested on": describes when the element receives keyboard
//   focus or mouse hover after a short delay (and hopefully soon, touch
//   longpress).
//
// - "activation": describes a mouse click, keyboard enter, or keyboard space.
//
// Only one tooltip can be visible at a time, so we use a global state chart to
// describe the various states and transitions between states that are
// possible.  With the all the timeouts involved with tooltips it's important to
// "make impossible states impossible" with a state machine.
//
// It's also okay to use these module globals because you don't server render
// tooltips. None of the state is changed outside of user events.
//
// There are a few features that are important to understand.
//
// 1. Tooltips don't show up until the user has rested on one, we don't
//    want tooltips popupping up as you move your mouse around the page.
//
// 2. Once any tooltip becomes visible, other tooltips nearby should skip
//    resting and display immediately.
//
// 3. Tooltips stick around for a little bit after blur/mouseleave.

/* eslint-disable default-case */

import React, { Fragment, cloneElement, Children, useState, useRef, forwardRef, useEffect } from "react";
import { useId } from "@reach/auto-id";
import { wrapEvent } from "@reach/utils";
import Portal from "@reach/portal";
import VisuallyHidden from "@reach/visually-hidden";
import { useRect } from "@reach/rect";
import { node, string, func } from "prop-types";

////////////////////////////////////////////////////////////////////////////////
var chart = {
  initial: "idle",
  states: {
    idle: {
      enter: clearContextId,
      on: {
        mouseenter: "focused",
        focus: "focused"
      }
    },
    focused: {
      enter: startRestTimer,
      leave: clearRestTimer,
      on: {
        mousemove: "focused",
        mouseleave: "idle",
        mousedown: "dismissed",
        blur: "idle",
        rest: "visible"
      }
    },
    visible: {
      on: {
        mouseleave: "leavingVisible",
        blur: "leavingVisible",
        mousedown: "dismissed",
        selectWithKeyboard: "dismissed"
      }
    },
    leavingVisible: {
      enter: startLeavingVisibleTimer,
      leave: function leave() {
        clearLeavingVisibleTimer();
        clearContextId();
      },
      on: {
        mouseenter: "visible",
        focus: "visible",
        timecomplete: "idle"
      }
    },
    dismissed: {
      leave: function leave() {
        // allows us to come on back later w/o entering something else first
        context.id = null;
      },
      on: {
        mouseleave: "idle",
        blur: "idle"
      }
    }
  }
};

// chart context allows us to persist some data around, in Tooltip all we use
// is the id of the current tooltip being interacted with.
var context = { id: null };
var state = chart.initial;

////////////////////////////////////////////////////////////////////////////////
// Finds the next state from the current state + action. If the chart doesn't
// describe that transition, it will throw.
//
// It also manages lifecycles of the machine, (enter/leave hooks on the state
// chart)
function transition(action, newContext) {
  var stateDef = chart.states[state];
  var nextState = stateDef.on[action];

  if (!nextState) {
    throw new Error("Unknown state for action \"" + action + "\" from state \"" + state + "\"");
  }

  if (stateDef.leave) {
    stateDef.leave();
  }

  if (newContext) {
    context = newContext;
  }

  var nextDef = chart.states[nextState];
  if (nextDef.enter) {
    nextDef.enter();
  }

  state = nextState;
  notify();
}

////////////////////////////////////////////////////////////////////////////////
// Subscriptions:
//
// We could require apps to render a <TooltipProvider> around the app and use
// React context to notify Tooltips of changes to our state machine, instead
// we manage subscriptions ourselves and simplify the Tooltip API.
//
// Maybe if default context could take a hook (instead of just a static value)
// that was rendered at the root for us, that'd be cool! But it doesn't.
var subscriptions = [];

function subscribe(fn) {
  subscriptions.push(fn);
  return function () {
    subscriptions.splice(subscriptions.indexOf(fn), 1);
  };
}

function notify() {
  subscriptions.forEach(function (fn) {
    return fn(state, context);
  });
}

////////////////////////////////////////////////////////////////////////////////
// Timeouts:

// Manages when the user "rests" on an element. Keeps the interface from being
// flashing tooltips all the time as the user moves the mouse around the screen.
var restTimeout = void 0;
function startRestTimer() {
  clearTimeout(restTimeout);
  restTimeout = setTimeout(function () {
    return transition("rest");
  }, 100);
}

function clearRestTimer() {
  clearTimeout(restTimeout);
}

// Manages the delay to hide the tooltip after rest leaves.
var leavingVisibleTimer = void 0;
function startLeavingVisibleTimer() {
  clearTimeout(leavingVisibleTimer);
  leavingVisibleTimer = setTimeout(function () {
    return transition("timecomplete");
  }, 500);
}

function clearLeavingVisibleTimer() {
  clearTimeout(leavingVisibleTimer);
}

////////////////////////////////////////////////////////////////////////////////
// Rando helpers

// allows us to come on back later w/o entering something else first after the
// user leaves or dismisses
function clearContextId() {
  context.id = null;
}

// Avoids focus/mouseEnter from fighting with each other since you can have
// one element focused and another mouseentered at the same time. The first
// one sets the context.id and then the second one is ignored (for a single
// element, most recent focus/mouseenter wins between elements).
function isActive(id) {
  return context.id === id;
}

////////////////////////////////////////////////////////////////////////////////
// THE HOOK!
export function useTooltip() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave,
      onFocus = _ref.onFocus,
      onBlur = _ref.onBlur,
      onKeyDown = _ref.onKeyDown,
      onMouseDown = _ref.onMouseDown,
      ref = _ref.ref;

  var _useState = useState(state === "visible"),
      isVisible = _useState[0],
      setIsVisible = _useState[1];

  // hopefully they always pass a ref if they ever pass one


  var triggerRef = ref || useRef();
  var triggerRect = useRect(triggerRef, isVisible);
  var id = "tooltip:" + useId();

  useEffect(function () {
    return subscribe(function () {
      if (context.id === id && (state === "visible" || state === "leavingVisible")) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    });
  }, [id]);

  var handleMouseEnter = function handleMouseEnter() {
    if (isActive(id) &&
    // enables leaving then entering again before the times up
    state !== "leavingVisible") {
      return;
    }

    switch (state) {
      case "idle":
      case "leavingVisible":
        {
          transition("mouseenter", { id: id });
        }
    }
  };

  var handleMouseMove = function handleMouseMove() {
    switch (state) {
      case "focused":
        {
          transition("mousemove", { id: id });
        }
    }
  };

  var handleFocus = function handleFocus() {
    if (isActive(id)) return;
    switch (state) {
      case "idle":
      case "leavingVisible":
        {
          transition("focus", { id: id });
        }
    }
  };

  var handleMouseLeave = function handleMouseLeave() {
    switch (state) {
      case "focused":
      case "visible":
      case "dismissed":
        {
          transition("mouseleave");
        }
    }
  };

  var handleBlur = function handleBlur() {
    // Allow quick click from one tool to another
    if (context.id !== id) return;
    switch (state) {
      case "focused":
      case "visible":
      case "dismissed":
        {
          transition("blur");
        }
    }
  };

  var handleMouseDown = function handleMouseDown() {
    // Allow quick click from one tool to another
    if (context.id !== id) return;
    switch (state) {
      case "focused":
      case "visible":
        {
          transition("mousedown");
        }
    }
  };

  var handleKeyDown = function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      switch (state) {
        case "visible":
          {
            transition("selectWithKeyboard");
          }
      }
    }
  };

  var trigger = {
    "aria-labelledby": id,
    "data-reach-tooltip-trigger": "",
    ref: triggerRef,
    onMouseEnter: wrapEvent(onMouseEnter, handleMouseEnter),
    onMouseMove: wrapEvent(onMouseMove, handleMouseMove),
    onFocus: wrapEvent(onFocus, handleFocus),
    onBlur: wrapEvent(onFocus, handleBlur),
    onMouseLeave: wrapEvent(onMouseLeave, handleMouseLeave),
    onKeyDown: wrapEvent(onKeyDown, handleKeyDown),
    onMouseDown: wrapEvent(onMouseDown, handleMouseDown)
  };

  var tooltip = {
    id: id,
    triggerRect: triggerRect,
    isVisible: isVisible
  };

  return [trigger, tooltip, isVisible];
}

////////////////////////////////////////////////////////////////////////////////
export default function Tooltip(_ref2) {
  var children = _ref2.children,
      label = _ref2.label,
      ariaLabel = _ref2.ariaLabel,
      rest = _objectWithoutProperties(_ref2, ["children", "label", "ariaLabel"]);

  var _useTooltip = useTooltip(),
      trigger = _useTooltip[0],
      tooltip = _useTooltip[1];

  return React.createElement(
    Fragment,
    null,
    cloneElement(Children.only(children), trigger),
    React.createElement(TooltipPopup, _extends({
      label: label,
      ariaLabel: ariaLabel
    }, tooltip, rest))
  );
}

process.env.NODE_ENV !== "production" ? Tooltip.propTypes = {
  children: node.isRequired,
  label: node.isRequired,
  ariaLabel: string
} : void 0;

////////////////////////////////////////////////////////////////////////////////
var TooltipPopup = forwardRef(function TooltipPopup(_ref3, forwardRef) {
  var label = _ref3.label,
      ariaLabel = _ref3.ariaLabel,
      position = _ref3.position,
      isVisible = _ref3.isVisible,
      id = _ref3.id,
      triggerRect = _ref3.triggerRect,
      rest = _objectWithoutProperties(_ref3, ["label", "ariaLabel", "position", "isVisible", "id", "triggerRect"]);

  return isVisible ? React.createElement(
    Portal,
    null,
    React.createElement(TooltipContent, _extends({
      label: label,
      ariaLabel: ariaLabel,
      position: position,
      isVisible: isVisible,
      id: id,
      triggerRect: triggerRect,
      ref: forwardRef
    }, rest))
  ) : null;
});

export { TooltipPopup };
process.env.NODE_ENV !== "production" ? TooltipPopup.propTypes = {
  label: node.isRequired,
  ariaLabel: string,
  position: func
} : void 0;

// Need a separate component so that useRect works inside the portal
var TooltipContent = forwardRef(function TooltipContent(_ref4, forwardRef) {
  var label = _ref4.label,
      ariaLabel = _ref4.ariaLabel,
      _ref4$position = _ref4.position,
      position = _ref4$position === undefined ? positionDefault : _ref4$position,
      isVisible = _ref4.isVisible,
      id = _ref4.id,
      triggerRect = _ref4.triggerRect,
      style = _ref4.style,
      rest = _objectWithoutProperties(_ref4, ["label", "ariaLabel", "position", "isVisible", "id", "triggerRect", "style"]);

  var useAriaLabel = ariaLabel != null;
  var tooltipRef = useRef();
  var tooltipRect = useRect(tooltipRef, isVisible);
  return React.createElement(
    Fragment,
    null,
    React.createElement("div", _extends({
      "data-reach-tooltip": true,
      role: useAriaLabel ? undefined : "tooltip",
      id: useAriaLabel ? undefined : id,
      children: label,
      style: _extends({}, style, getStyles(position, triggerRect, tooltipRect)),
      ref: function ref(node) {
        tooltipRef.current = node;
        if (forwardRef) forwardRef(node);
      }
    }, rest)),
    useAriaLabel && React.createElement(
      VisuallyHidden,
      { role: "tooltip", id: id },
      ariaLabel
    )
  );
});

////////////////////////////////////////////////////////////////////////////////
// TODO: research longpress tooltips on Android, iOS, implement here.
// - Probably want to position it by default above, since your thumb
//   is below and would cover it
// - I'm thinking after longpress, display the tooltip and cancel any
//   click events. Then on touchend, hide the tooltip after a timer
//   in case their hand is obstructing it, then can remove and read
//   the tooltip

// feels awkward when it's perfectly aligned w/ the trigger
var OFFSET = 8;

var getStyles = function getStyles(position, triggerRect, tooltipRect) {
  var haventMeasuredTooltipYet = !tooltipRect;
  if (haventMeasuredTooltipYet) {
    return { visibility: "hidden" };
  }
  return position(triggerRect, tooltipRect);
};

var positionDefault = function positionDefault(triggerRect, tooltipRect) {
  var styles = {
    left: triggerRect.left + window.scrollX + "px",
    top: triggerRect.top + triggerRect.height + window.scrollY + "px"
  };

  var collisions = {
    top: triggerRect.top - tooltipRect.height < 0,
    right: window.innerWidth < triggerRect.left + tooltipRect.width,
    bottom: window.innerHeight < triggerRect.bottom + tooltipRect.height + OFFSET,
    left: triggerRect.left - tooltipRect.width < 0
  };

  var directionRight = collisions.right && !collisions.left;
  var directionUp = collisions.bottom && !collisions.top;

  return _extends({}, styles, {
    left: directionRight ? triggerRect.right + OFFSET / 2 - tooltipRect.width + window.scrollX + "px" : triggerRect.left - OFFSET / 2 + window.scrollX + "px",
    top: directionUp ? triggerRect.top - OFFSET - tooltipRect.height + window.scrollY + "px" : triggerRect.top + OFFSET + triggerRect.height + window.scrollY + "px"
  });
};