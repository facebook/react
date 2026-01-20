/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DevToolsHook} from 'react-devtools-shared/src/backend/types';
import type Agent from 'react-devtools-shared/src/backend/agent';

import Overlay from 'react-devtools-shared/src/backend/views/Highlighter/Overlay';
import {COMPACT_VERSION_NAME} from 'react-devtools-extensions/src/utils';

// Guard against multiple injections
if (!window.__REACT_DEVTOOLS_STANDALONE_INSPECTOR__) {
  window.__REACT_DEVTOOLS_STANDALONE_INSPECTOR__ = true;

  // Use IIFE to create proper scope for function declarations
  (function () {
    let inspectionActive = false;
    let agent: Agent | null = null;
    let overlay: Overlay | null = null;
    let notReactBubble: HTMLElement | null = null;
    let nonReactHoverTimer: TimeoutID | null = null;
    let lastHoveredElement: EventTarget | null = null;

    window.addEventListener('message', handleMessage);

    function handleMessage(event: MessageEvent): void {
      if (event.source !== window) {
        return;
      }

      const data = (event.data: any);
      if (data?.source !== 'react-devtools-standalone-inspector-proxy') {
        return;
      }

      if (data.type === 'startInspection') {
        startInspection();
      } else if (data.type === 'stopInspection') {
        stopInspection();
      }
    }

    function hideLoadingIndicator(): void {
      const indicator = document.getElementById(
        '__react-devtools-loading-indicator__',
      );
      indicator?.parentNode?.removeChild(indicator);

      const style = document.getElementById(
        '__react-devtools-loading-style__',
      );
      style?.parentNode?.removeChild(style);

      delete window.__REACT_DEVTOOLS_INSPECTION_LOADING__;
    }

    function showReadyIndicator(): void {
      const indicator = document.createElement('div');
      Object.assign(indicator.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '10000002',
        backgroundColor: 'rgba(97, 218, 251, 0.95)',
        color: '#1a1a2e',
        borderRadius: '6px',
        padding: '8px 16px',
        fontFamily:
          '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'opacity 0.3s ease-out',
      });
      indicator.textContent = '✓ Inspection mode active (Press Esc to exit)';
      document.body.appendChild(indicator);
      document.body.style.cursor = 'crosshair';

      // Fade out and remove after 2 seconds
      setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
          indicator.parentNode?.removeChild(indicator);
        }, 300);
      }, 2000);
    }

    function startInspection(): void {
      if (inspectionActive) {
        return;
      }

      const hook: ?DevToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook) {
        hideLoadingIndicator();
        document.body.style.cursor = '';
        console.warn(
          'React DevTools: Global hook not found. Is React DevTools extension installed?',
        );
        return;
      }

      // Use existing agent if DevTools panel is open, otherwise activate standalone backend
      agent = hook.reactDevtoolsAgent ?? activateStandaloneBackend(hook);

      hideLoadingIndicator();

      if (!agent) {
        document.body.style.cursor = '';
        console.warn(
          'React DevTools: Could not activate backend. The page may not have React loaded.',
        );
        return;
      }

      overlay = new Overlay(agent);
      inspectionActive = true;
      window.addEventListener('pointermove', onPointerMove, true);
      window.addEventListener('pointerdown', onPointerDown, true);
      window.addEventListener('keydown', onKeyDown, true);
      showReadyIndicator();
    }

    function activateStandaloneBackend(hook: DevToolsHook): Agent | null {
      let backend = hook.backends.get(COMPACT_VERSION_NAME);
      if (!backend && hook.backends.size > 0) {
        backend = hook.backends.values().next().value;
      }

      if (!backend) {
        console.warn(
          'React DevTools: No backend available. The backend script may not have been injected.',
        );
        return null;
      }

      const {Agent: AgentClass, Bridge, initBackend} = backend;

      // Create a no-op bridge since we don't communicate with a frontend panel
      const bridge = new Bridge({
        listen: () => () => {},
        send: () => {},
      });

      const newAgent = new AgentClass(bridge, false);
      initBackend(hook, newAgent, window, false);
      window.__REACT_DEVTOOLS_STANDALONE_BACKEND_ACTIVE__ = true;

      return newAgent;
    }

    function stopInspection(): void {
      if (!inspectionActive) {
        return;
      }

      inspectionActive = false;
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);

      if (overlay) {
        overlay.remove();
        overlay = null;
      }

      hideNotReactBubble();
      hideLoadingIndicator();
      clearNonReactTimer();
      document.body.style.cursor = '';
      agent = null;
      lastHoveredElement = null;

      window.postMessage(
        {
          source: 'react-devtools-standalone-inspector',
          type: 'inspectionStopped',
        },
        '*',
      );
    }

    function onPointerMove(event: PointerEvent): void {
      if (!inspectionActive || !agent) {
        return;
      }

      const target = getEventTarget(event);
      if (!target) {
        return;
      }

      if (target === lastHoveredElement) {
        return;
      }
      lastHoveredElement = target;

      clearNonReactTimer();
      hideNotReactBubble();

      const componentName = agent.getComponentNameForHostInstance(target);
      if (componentName) {
        overlay?.inspect([target], componentName);
      } else {
        if (overlay) {
          overlay.remove();
          overlay = new Overlay(agent);
        }
        nonReactHoverTimer = setTimeout(() => {
          showNotReactBubble(target);
        }, 3000);
      }
    }

    function onPointerDown(event: PointerEvent): void {
      if (inspectionActive) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        stopInspection();
      }
    }

    function getEventTarget(event: PointerEvent): HTMLElement | null {
      const path = event.composedPath();
      if (path.length > 0 && path[0] instanceof HTMLElement) {
        return path[0];
      }
      return event.target instanceof HTMLElement ? event.target : null;
    }

    function clearNonReactTimer(): void {
      if (nonReactHoverTimer) {
        clearTimeout(nonReactHoverTimer);
        nonReactHoverTimer = null;
      }
    }

    function showNotReactBubble(target: HTMLElement): void {
      hideNotReactBubble();

      notReactBubble = document.createElement('div');
      Object.assign(notReactBubble.style, {
        position: 'fixed',
        zIndex: '10000001',
        backgroundColor: 'rgba(51, 55, 64, 0.9)',
        color: '#d7d7d7',
        borderRadius: '4px',
        padding: '6px 10px',
        fontFamily:
          '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        transform: 'translateX(-50%)',
      });
      notReactBubble.textContent = 'Not rendered with React';

      const rect = target.getBoundingClientRect();
      notReactBubble.style.left = `${Math.max(10, rect.left + rect.width / 2)}px`;
      notReactBubble.style.top = `${Math.max(10, rect.top - 30)}px`;

      document.body.appendChild(notReactBubble);

      setTimeout(hideNotReactBubble, 2000);
    }

    function hideNotReactBubble(): void {
      notReactBubble?.parentNode?.removeChild(notReactBubble);
      notReactBubble = null;
    }
  })();
}
