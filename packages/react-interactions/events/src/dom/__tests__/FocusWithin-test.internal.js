/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget, setPointerEvent} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let FocusWithinResponder;
let useFocusWithin;
let Scheduler;

const initializeModules = hasPointerEvents => {
  setPointerEvent(hasPointerEvents);
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableDeprecatedFlareAPI = true;
  ReactFeatureFlags.enableScopeAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  Scheduler = require('scheduler');

  // TODO: This import throws outside of experimental mode. Figure out better
  // strategy for gated imports.
  if (__EXPERIMENTAL__) {
    FocusWithinResponder = require('react-interactions/events/deprecated-focus')
      .FocusWithinResponder;
    useFocusWithin = require('react-interactions/events/deprecated-focus')
      .useFocusWithin;
  }
};

const forcePointerEvents = true;
const table = [[forcePointerEvents], [!forcePointerEvents]];

describe.each(table)('FocusWithin responder', hasPointerEvents => {
  let container;

  beforeEach(() => {
    initializeModules();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onFocusWithinChange, onFocusWithinVisibleChange, ref;

    const componentInit = () => {
      onFocusWithinChange = jest.fn();
      onFocusWithinVisibleChange = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useFocusWithin({
          disabled: true,
          onFocusWithinChange,
          onFocusWithinVisibleChange,
        });
        return <div ref={ref} DEPRECATED_flareListeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    };

    // @gate experimental
    it('prevents custom events being dispatched', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.focus();
      target.blur();
      expect(onFocusWithinChange).not.toBeCalled();
      expect(onFocusWithinVisibleChange).not.toBeCalled();
    });
  });

  describe('onFocusWithinChange', () => {
    let onFocusWithinChange, ref, innerRef, innerRef2;

    const Component = ({show}) => {
      const listener = useFocusWithin({
        onFocusWithinChange,
      });
      return (
        <div ref={ref} DEPRECATED_flareListeners={listener}>
          {show && <input ref={innerRef} />}
          <div ref={innerRef2} />
        </div>
      );
    };

    const componentInit = () => {
      onFocusWithinChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
      ReactDOM.render(<Component show={true} />, container);
    };

    // @gate experimental
    it('is called after "blur" and "focus" events on focus target', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      target.focus();
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is called after "blur" and "focus" events on descendants', () => {
      componentInit();
      const target = createEventTarget(innerRef.current);
      target.focus();
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is only called once when focus moves within and outside the subtree', () => {
      componentInit();
      const node = ref.current;
      const innerNode1 = innerRef.current;
      const innerNode2 = innerRef.current;
      const target = createEventTarget(node);
      const innerTarget1 = createEventTarget(innerNode1);
      const innerTarget2 = createEventTarget(innerNode2);

      // focus shifts into subtree
      innerTarget1.focus();
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerTarget1.blur({relatedTarget: innerNode2});
      innerTarget2.focus();
      innerTarget2.blur({relatedTarget: node});
      target.focus();
      target.blur({relatedTarget: innerNode1});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerTarget1.blur({relatedTarget: container});
      expect(onFocusWithinChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onFocusWithinVisibleChange', () => {
    let onFocusWithinVisibleChange, ref, innerRef, innerRef2;

    const Component = ({show}) => {
      const listener = useFocusWithin({
        onFocusWithinVisibleChange,
      });
      return (
        <div ref={ref} DEPRECATED_flareListeners={listener}>
          {show && <input ref={innerRef} />}
          <div ref={innerRef2} />
        </div>
      );
    };

    const componentInit = () => {
      onFocusWithinVisibleChange = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
      ReactDOM.render(<Component show={true} />, container);
    };

    // @gate experimental
    it('is called after "focus" and "blur" on focus target if keyboard was used', () => {
      componentInit();
      const target = createEventTarget(ref.current);
      const containerTarget = createEventTarget(container);
      // use keyboard first
      containerTarget.keydown({key: 'Tab'});
      target.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      target.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is called after "focus" and "blur" on descendants if keyboard was used', () => {
      componentInit();
      const innerTarget = createEventTarget(innerRef.current);
      const containerTarget = createEventTarget(container);
      // use keyboard first
      containerTarget.keydown({key: 'Tab'});
      innerTarget.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      innerTarget.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });

    // @gate experimental
    it('is called if non-keyboard event is dispatched on target previously focused with keyboard', () => {
      componentInit();
      const node = ref.current;
      const innerNode1 = innerRef.current;
      const innerNode2 = innerRef2.current;

      const target = createEventTarget(node);
      const innerTarget1 = createEventTarget(innerNode1);
      const innerTarget2 = createEventTarget(innerNode2);
      // use keyboard first
      target.focus();
      target.keydown({key: 'Tab'});
      target.blur({relatedTarget: innerNode1});
      innerTarget1.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the next target, focus should no longer be visible
      innerTarget2.pointerdown();
      innerTarget1.blur({relatedTarget: innerNode2});
      innerTarget2.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // then use keyboard again
      innerTarget2.keydown({key: 'Tab', shiftKey: true});
      innerTarget2.blur({relatedTarget: innerNode1});
      innerTarget1.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(3);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // then use pointer on the target, focus should no longer be visible
      innerTarget1.pointerdown();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
      // onFocusVisibleChange should not be called again
      innerTarget1.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(4);
    });

    // @gate experimental
    it('is not called after "focus" and "blur" events without keyboard', () => {
      componentInit();
      const innerTarget = createEventTarget(innerRef.current);
      innerTarget.pointerdown();
      innerTarget.pointerup();
      innerTarget.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(0);
    });

    // @gate experimental
    it('is only called once when focus moves within and outside the subtree', () => {
      componentInit();
      const node = ref.current;
      const innerNode1 = innerRef.current;
      const innerNode2 = innerRef2.current;
      const target = createEventTarget(node);
      const innerTarget1 = createEventTarget(innerNode1);
      const innerTarget2 = createEventTarget(innerNode2);

      // focus shifts into subtree
      innerTarget1.focus();
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(true);
      // focus moves around subtree
      innerTarget1.blur({relatedTarget: innerNode2});
      innerTarget2.focus();
      innerTarget2.blur({relatedTarget: node});
      target.focus();
      target.blur({relatedTarget: innerNode1});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(1);
      // focus shifts outside subtree
      innerTarget1.blur({relatedTarget: container});
      expect(onFocusWithinVisibleChange).toHaveBeenCalledTimes(2);
      expect(onFocusWithinVisibleChange).toHaveBeenCalledWith(false);
    });
  });

  describe('onBeforeBlurWithin', () => {
    let onBeforeBlurWithin, onAfterBlurWithin, ref, innerRef, innerRef2;

    beforeEach(() => {
      onBeforeBlurWithin = jest.fn();
      onAfterBlurWithin = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      innerRef2 = React.createRef();
    });

    // @gate experimental
    it('is called after a focused element is unmounted', () => {
      const Component = ({show}) => {
        const listener = useFocusWithin({
          onBeforeBlurWithin,
          onAfterBlurWithin,
        });
        return (
          <div ref={ref} DEPRECATED_flareListeners={listener}>
            {show && <input ref={innerRef} />}
            <div ref={innerRef2} />
          </div>
        );
      };

      ReactDOM.render(<Component show={true} />, container);

      const inner = innerRef.current;
      const target = createEventTarget(inner);
      target.keydown({key: 'Tab'});
      target.focus();
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(0);
      expect(onAfterBlurWithin).toHaveBeenCalledTimes(0);
      ReactDOM.render(<Component show={false} />, container);
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(1);
      expect(onAfterBlurWithin).toHaveBeenCalledTimes(1);
      expect(onAfterBlurWithin).toHaveBeenCalledWith(
        expect.objectContaining({relatedTarget: inner}),
      );
    });

    // @gate experimental
    it('is called after a nested focused element is unmounted', () => {
      const Component = ({show}) => {
        const listener = useFocusWithin({
          onBeforeBlurWithin,
          onAfterBlurWithin,
        });
        return (
          <div ref={ref} DEPRECATED_flareListeners={listener}>
            {show && (
              <div>
                <input ref={innerRef} />
              </div>
            )}
            <div ref={innerRef2} />
          </div>
        );
      };

      ReactDOM.render(<Component show={true} />, container);

      const inner = innerRef.current;
      const target = createEventTarget(inner);
      target.keydown({key: 'Tab'});
      target.focus();
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(0);
      expect(onAfterBlurWithin).toHaveBeenCalledTimes(0);
      ReactDOM.render(<Component show={false} />, container);
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(1);
      expect(onAfterBlurWithin).toHaveBeenCalledTimes(1);
      expect(onAfterBlurWithin).toHaveBeenCalledWith(
        expect.objectContaining({relatedTarget: inner}),
      );
    });

    // @gate experimental
    it('is called after a nested focused element is unmounted (with scope query)', () => {
      const TestScope = React.unstable_createScope();
      const testScopeQuery = (type, props) => true;
      let targetNodes;
      let targetNode;

      const Component = ({show}) => {
        const scopeRef = React.useRef(null);
        const listener = useFocusWithin({
          onBeforeBlurWithin(event) {
            const scope = scopeRef.current;
            targetNode = innerRef.current;
            targetNodes = scope.DO_NOT_USE_queryAllNodes(testScopeQuery);
          },
        });

        return (
          <TestScope ref={scopeRef} DEPRECATED_flareListeners={[listener]}>
            {show && <input ref={innerRef} />}
          </TestScope>
        );
      };

      ReactDOM.render(<Component show={true} />, container);

      const inner = innerRef.current;
      const target = createEventTarget(inner);
      target.keydown({key: 'Tab'});
      target.focus();
      ReactDOM.render(<Component show={false} />, container);
      expect(targetNodes).toEqual([targetNode]);
    });

    // @gate experimental
    it('is called after a nested FocusRegion is unmounted', () => {
      const TestScope = React.unstable_createScope();
      const testScopeQuery = (type, props) => true;
      const buttonRef = React.createRef();
      const button2Ref = React.createRef();
      const nestedButtonRef = React.createRef();

      const FocusRegion = ({autoFocus, children}) => {
        const scopeRef = React.useRef(null);
        const prevElementsRef = React.useRef(null);
        const listener = useFocusWithin({
          onBeforeBlurWithin(event) {
            // We continue propagation so nested FocusRegions can correctly
            // pick up changes of beforeblur occuring below.
            event.continuePropagation();
            const scope = scopeRef.current;
            if (scope !== null) {
              const detachedNode = event.target;
              const scopedNodes = scope.DO_NOT_USE_queryAllNodes(
                (type, props, instance) =>
                  detachedNode === instance ||
                  testScopeQuery(type, props, instance),
              );
              if (scopedNodes === null) {
                return;
              }
              // Build up arrays of nodes that are before to the detached node
              const prevRecoveryElements = [];
              for (let i = 0; i < scopedNodes.length; i++) {
                const node = scopedNodes[i];
                if (node === detachedNode) {
                  break;
                }
                prevRecoveryElements.push(node);
              }
              // Store this in the ref to use later
              prevElementsRef.current = {
                recovery: prevRecoveryElements,
                all: scopedNodes,
              };
            }
          },
          onAfterBlurWithin(event) {
            event.continuePropagation();
            const scope = scopeRef.current;
            const prevElements = prevElementsRef.current;

            if (scope !== null && prevElements !== null) {
              const {recovery, all} = prevElements;
              const scopedNodes = scope.DO_NOT_USE_queryAllNodes(
                testScopeQuery,
              );
              if (scopedNodes !== null) {
                const scopeNodesSet = new Set(scopedNodes);
                const allPreviousNodesSet = new Set(all);

                // Look for closest previous node
                for (let i = recovery.length - 1; i >= 0; i--) {
                  const prevRecoveryElement = recovery[i];
                  // If we find a match, focus nearby and exit early
                  if (scopeNodesSet.has(prevRecoveryElement)) {
                    const prevElementIndex = scopedNodes.indexOf(
                      prevRecoveryElement,
                    );
                    const replaceIndex = prevElementIndex + 1;
                    if (replaceIndex < scopedNodes.length) {
                      // Focus on the element that 'replaced' the previously focused element
                      const possibleReplacedNode = scopedNodes[replaceIndex];
                      if (!allPreviousNodesSet.has(possibleReplacedNode)) {
                        possibleReplacedNode.focus();
                        return;
                      }
                    }
                    // If there's no new focusable element, fallback to focusing
                    // on the previous recovery element
                    prevRecoveryElement.focus();
                    return;
                  }
                }
                // Otherwise focus the first element
                scopedNodes[0].focus();
              }
            }
          },
        });

        const attemptAutofocus = React.useCallback(() => {
          const scope = scopeRef.current;
          const activeElement = document.activeElement;
          if (
            scope !== null &&
            autoFocus === true &&
            (!activeElement || !scope.containsNode(activeElement))
          ) {
            const scopedNodes = scope.DO_NOT_USE_queryAllNodes(testScopeQuery);
            if (scopedNodes !== null) {
              scopedNodes[0].focus();
            }
          }
        }, [autoFocus]);
        React.useLayoutEffect(attemptAutofocus, [attemptAutofocus]);
        React.useEffect(attemptAutofocus, [attemptAutofocus]);

        return (
          <TestScope ref={scopeRef} DEPRECATED_flareListeners={listener}>
            {children}
          </TestScope>
        );
      };

      const Test = ({showNestedRegion}) => (
        <div>
          <FocusRegion autoFocus={true}>
            <button ref={buttonRef}>Press me!</button>
            {showNestedRegion ? (
              <FocusRegion autoFocus={true}>
                <button ref={nestedButtonRef}>Press me 2!</button>
              </FocusRegion>
            ) : null}
            <button ref={button2Ref}>Press me!</button>
          </FocusRegion>
        </div>
      );

      ReactDOM.render(<Test showNestedRegion={false} />, container);
      expect(document.activeElement).toBe(buttonRef.current);
      ReactDOM.render(<Test showNestedRegion={true} />, container);
      expect(document.activeElement).toBe(nestedButtonRef.current);
      ReactDOM.render(<Test showNestedRegion={false} />, container);
      expect(document.activeElement).toBe(buttonRef.current);
    });

    // @gate experimental
    it('is called after a focused suspended element is hidden', () => {
      const Suspense = React.Suspense;
      let suspend = false;
      let resolve;
      const promise = new Promise(resolvePromise => (resolve = resolvePromise));

      function Child() {
        if (suspend) {
          throw promise;
        } else {
          return <input ref={innerRef} />;
        }
      }

      const Component = ({show}) => {
        const listener = useFocusWithin({
          onBeforeBlurWithin,
          onAfterBlurWithin,
        });

        return (
          <div DEPRECATED_flareListeners={listener}>
            <Suspense fallback="Loading...">
              <Child />
            </Suspense>
          </div>
        );
      };

      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      const root = ReactDOM.createRoot(container2);
      root.render(<Component />);
      Scheduler.unstable_flushAll();
      jest.runAllTimers();
      expect(container2.innerHTML).toBe('<div><input></div>');

      const inner = innerRef.current;
      const target = createEventTarget(inner);
      target.keydown({key: 'Tab'});
      target.focus();
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(0);
      expect(onAfterBlurWithin).toHaveBeenCalledTimes(0);

      suspend = true;
      root.render(<Component />);
      Scheduler.unstable_flushAll();
      jest.runAllTimers();
      expect(container2.innerHTML).toBe(
        '<div><input style="display: none;">Loading...</div>',
      );
      expect(onBeforeBlurWithin).toHaveBeenCalledTimes(1);
      expect(onAfterBlurWithin).toHaveBeenCalledTimes(1);
      resolve();

      document.body.removeChild(container2);
    });
  });

  // @gate experimental
  it('expect displayName to show up for event component', () => {
    expect(FocusWithinResponder.displayName).toBe('FocusWithin');
  });
});
