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

import React, {
  Fragment,
  cloneElement,
  Children,
  useState,
  useRef,
  forwardRef,
  useEffect
} from "react";
import { useId } from "@reach/auto-id";
import { wrapEvent } from "@reach/utils";
import Portal from "@reach/portal";
import VisuallyHidden from "@reach/visually-hidden";
import { useRect } from "@reach/rect";
import { node, string, func } from "prop-types";

////////////////////////////////////////////////////////////////////////////////
const chart = {
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
      leave: () => {
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
      leave: () => {
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
let context = { id: null };
let state = chart.initial;

////////////////////////////////////////////////////////////////////////////////
// Finds the next state from the current state + action. If the chart doesn't
// describe that transition, it will throw.
//
// It also manages lifecycles of the machine, (enter/leave hooks on the state
// chart)
function transition(action, newContext) {
  const stateDef = chart.states[state];
  const nextState = stateDef.on[action];

  if (!nextState) {
    throw new Error(
      `Unknown state for action "${action}" from state "${state}"`
    );
  }

  if (stateDef.leave) {
    stateDef.leave();
  }

  if (newContext) {
    context = newContext;
  }

  const nextDef = chart.states[nextState];
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
const subscriptions = [];

function subscribe(fn) {
  subscriptions.push(fn);
  return () => {
    subscriptions.splice(subscriptions.indexOf(fn), 1);
  };
}

function notify() {
  subscriptions.forEach(fn => fn(state, context));
}

////////////////////////////////////////////////////////////////////////////////
// Timeouts:

// Manages when the user "rests" on an element. Keeps the interface from being
// flashing tooltips all the time as the user moves the mouse around the screen.
let restTimeout;
function startRestTimer() {
  clearTimeout(restTimeout);
  restTimeout = setTimeout(() => transition("rest"), 100);
}

function clearRestTimer() {
  clearTimeout(restTimeout);
}

// Manages the delay to hide the tooltip after rest leaves.
let leavingVisibleTimer;
function startLeavingVisibleTimer() {
  clearTimeout(leavingVisibleTimer);
  leavingVisibleTimer = setTimeout(() => transition("timecomplete"), 500);
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
export function useTooltip({
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  onMouseDown,
  ref
} = {}) {
  const [isVisible, setIsVisible] = useState(state === "visible");

  // hopefully they always pass a ref if they ever pass one
  const triggerRef = ref || useRef();
  const triggerRect = useRect(triggerRef, isVisible);
  const id = `tooltip:${useId()}`;

  useEffect(() => {
    return subscribe(() => {
      if (
        context.id === id &&
        (state === "visible" || state === "leavingVisible")
      ) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    });
  }, [id]);

  const handleMouseEnter = () => {
    if (
      isActive(id) &&
      // enables leaving then entering again before the times up
      state !== "leavingVisible"
    ) {
      return;
    }

    switch (state) {
      case "idle":
      case "leavingVisible": {
        transition("mouseenter", { id });
      }
    }
  };

  const handleMouseMove = () => {
    switch (state) {
      case "focused": {
        transition("mousemove", { id });
      }
    }
  };

  const handleFocus = () => {
    if (isActive(id)) return;
    switch (state) {
      case "idle":
      case "leavingVisible": {
        transition("focus", { id });
      }
    }
  };

  const handleMouseLeave = () => {
    switch (state) {
      case "focused":
      case "visible":
      case "dismissed": {
        transition("mouseleave");
      }
    }
  };

  const handleBlur = () => {
    // Allow quick click from one tool to another
    if (context.id !== id) return;
    switch (state) {
      case "focused":
      case "visible":
      case "dismissed": {
        transition("blur");
      }
    }
  };

  const handleMouseDown = () => {
    // Allow quick click from one tool to another
    if (context.id !== id) return;
    switch (state) {
      case "focused":
      case "visible": {
        transition("mousedown");
      }
    }
  };

  const handleKeyDown = event => {
    if (event.key === "Enter" || event.key === " ") {
      switch (state) {
        case "visible": {
          transition("selectWithKeyboard");
        }
      }
    }
  };

  const trigger = {
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

  const tooltip = {
    id,
    triggerRect,
    isVisible
  };

  return [trigger, tooltip, isVisible];
}

////////////////////////////////////////////////////////////////////////////////
export default function Tooltip({ children, label, ariaLabel, ...rest }) {
  const [trigger, tooltip] = useTooltip();
  return (
    <Fragment>
      {cloneElement(Children.only(children), trigger)}
      <TooltipPopup
        label={label}
        ariaLabel={ariaLabel}
        {...tooltip}
        {...rest}
      />
    </Fragment>
  );
}

Tooltip.propTypes = {
  children: node.isRequired,
  label: node.isRequired,
  ariaLabel: string
};

////////////////////////////////////////////////////////////////////////////////
export const TooltipPopup = forwardRef(function TooltipPopup(
  {
    // own props
    label, // could use children but want to encourage simple strings
    ariaLabel,
    position,

    // hook spread props
    isVisible,
    id,
    triggerRect,
    ...rest
  },
  forwardRef
) {
  return isVisible ? (
    <Portal>
      <TooltipContent
        label={label}
        ariaLabel={ariaLabel}
        position={position}
        isVisible={isVisible}
        id={id}
        triggerRect={triggerRect}
        ref={forwardRef}
        {...rest}
      />
    </Portal>
  ) : null;
});

TooltipPopup.propTypes = {
  label: node.isRequired,
  ariaLabel: string,
  position: func
};

// Need a separate component so that useRect works inside the portal
const TooltipContent = forwardRef(function TooltipContent(
  {
    label,
    ariaLabel,
    position = positionDefault,
    isVisible,
    id,
    triggerRect,
    style,
    ...rest
  },
  forwardRef
) {
  const useAriaLabel = ariaLabel != null;
  const tooltipRef = useRef();
  const tooltipRect = useRect(tooltipRef, isVisible);
  return (
    <Fragment>
      <div
        data-reach-tooltip
        role={useAriaLabel ? undefined : "tooltip"}
        id={useAriaLabel ? undefined : id}
        children={label}
        style={{
          ...style,
          ...getStyles(position, triggerRect, tooltipRect)
        }}
        ref={node => {
          tooltipRef.current = node;
          if (forwardRef) forwardRef(node);
        }}
        {...rest}
      />
      {useAriaLabel && (
        <VisuallyHidden role="tooltip" id={id}>
          {ariaLabel}
        </VisuallyHidden>
      )}
    </Fragment>
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
const OFFSET = 8;

const getStyles = (position, triggerRect, tooltipRect) => {
  const haventMeasuredTooltipYet = !tooltipRect;
  if (haventMeasuredTooltipYet) {
    return { visibility: "hidden" };
  }
  return position(triggerRect, tooltipRect);
};

const positionDefault = (triggerRect, tooltipRect) => {
  const styles = {
    left: `${triggerRect.left + window.scrollX}px`,
    top: `${triggerRect.top + triggerRect.height + window.scrollY}px`
  };

  const collisions = {
    top: triggerRect.top - tooltipRect.height < 0,
    right: window.innerWidth < triggerRect.left + tooltipRect.width,
    bottom:
      window.innerHeight < triggerRect.bottom + tooltipRect.height + OFFSET,
    left: triggerRect.left - tooltipRect.width < 0
  };

  const directionRight = collisions.right && !collisions.left;
  const directionUp = collisions.bottom && !collisions.top;

  return {
    ...styles,
    left: directionRight
      ? `${triggerRect.right +
          OFFSET / 2 -
          tooltipRect.width +
          window.scrollX}px`
      : `${triggerRect.left - OFFSET / 2 + window.scrollX}px`,
    top: directionUp
      ? `${triggerRect.top - OFFSET - tooltipRect.height + window.scrollY}px`
      : `${triggerRect.top + OFFSET + triggerRect.height + window.scrollY}px`
  };
};
